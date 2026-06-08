import { PlanAbonnement } from '@prisma/client';
import prisma from '../../config/prisma';
import { env } from '../../config/env';
import { HttpError } from '../../middleware/error.middleware';
import {
  getStripe,
  type StripeCheckoutSession,
  type StripeEvent,
  type StripeSubscription,
} from '../../lib/stripe';
import type { PlanPayant } from './billing.schema';

/** Statuts Stripe qui font retomber le compte en plan gratuit. */
const STATUTS_INACTIFS = new Set([
  'canceled',
  'unpaid',
  'incomplete_expired',
  'past_due',
]);

/** Price ID Stripe configuré pour un plan payant (503 si absent). */
const priceIdForPlan = (plan: PlanPayant): string => {
  const id =
    plan === 'famille' ? env.STRIPE_PRICE_FAMILLE : env.STRIPE_PRICE_FAMILLE_PLUS;
  if (!id) {
    throw new HttpError(503, `Tarif Stripe non configuré pour le plan ${plan}.`);
  }
  return id;
};

/** Mappe un price ID Stripe → plan Prisma (pour le webhook). null si inconnu. */
const planForPriceId = (priceId: string | undefined): PlanAbonnement | null => {
  if (!priceId) return null;
  if (priceId === env.STRIPE_PRICE_FAMILLE) return PlanAbonnement.famille;
  if (priceId === env.STRIPE_PRICE_FAMILLE_PLUS) return PlanAbonnement.famille_plus;
  return null;
};

/** Crée (ou réutilise) le client Stripe du parent, puis une session de checkout. */
export const createCheckoutSession = async (parentId: string, plan: PlanPayant) => {
  const stripe = getStripe();
  const price = priceIdForPlan(plan);

  const parent = await prisma.utilisateur.findUnique({ where: { id: parentId } });
  if (!parent) throw new HttpError(404, 'Compte introuvable');

  let customerId = parent.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: parent.email,
      metadata: { utilisateurId: parent.id },
    });
    customerId = customer.id;
    await prisma.utilisateur.update({
      where: { id: parent.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: env.STRIPE_SUCCESS_URL,
    cancel_url: env.STRIPE_CANCEL_URL,
    metadata: { utilisateurId: parent.id, plan },
    subscription_data: { metadata: { utilisateurId: parent.id, plan } },
  });

  return { url: session.url, sessionId: session.id };
};

/** Lecture de l'état d'abonnement du parent (pour l'écran P33). */
export const getSubscriptionStatus = async (parentId: string) => {
  const parent = await prisma.utilisateur.findUnique({
    where: { id: parentId },
    select: {
      plan: true,
      statutAbonnement: true,
      abonnementFinPeriode: true,
      stripeSubscriptionId: true,
    },
  });
  if (!parent) throw new HttpError(404, 'Compte introuvable');
  return {
    plan: parent.plan,
    statut: parent.statutAbonnement,
    finPeriode: parent.abonnementFinPeriode,
    actif: !!parent.stripeSubscriptionId && parent.plan !== PlanAbonnement.gratuit,
  };
};

/** Applique la mise à jour d'abonnement issue d'un objet subscription Stripe. */
const applySubscription = async (sub: StripeSubscription) => {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const user = await prisma.utilisateur.findUnique({
    where: { stripeCustomerId: customerId },
  });
  if (!user) return; // client Stripe inconnu côté Kizzo → on ignore.

  const priceId = sub.items?.data?.[0]?.price?.id;
  const planFromPrice = planForPriceId(priceId);
  const inactif = STATUTS_INACTIFS.has(sub.status);
  const finPeriode = sub.items?.data?.[0]?.current_period_end
    ? new Date(sub.items.data[0].current_period_end * 1000)
    : null;

  await prisma.utilisateur.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: sub.id,
      statutAbonnement: sub.status,
      abonnementFinPeriode: finPeriode,
      // Abonnement actif → plan correspondant ; sinon retour au gratuit.
      plan: inactif ? PlanAbonnement.gratuit : planFromPrice ?? user.plan,
    },
  });
};

/**
 * Traite un événement webhook Stripe déjà vérifié (signature). Idempotent :
 * on relit toujours l'état depuis l'objet Stripe.
 */
export const handleEvent = async (event: StripeEvent): Promise<void> => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session: StripeCheckoutSession = event.data.object;
      const utilisateurId = session.metadata?.utilisateurId;
      const customerId =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? null;
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null;
      const planMeta = session.metadata?.plan as PlanPayant | undefined;

      if (!utilisateurId) return;
      await prisma.utilisateur.update({
        where: { id: utilisateurId },
        data: {
          stripeCustomerId: customerId ?? undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
          statutAbonnement: 'active',
          plan:
            planMeta === 'famille_plus'
              ? PlanAbonnement.famille_plus
              : PlanAbonnement.famille,
        },
      });
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await applySubscription(event.data.object);
      break;
    }
    default:
      // Événements non gérés : ignorés silencieusement (200 OK côté contrôleur).
      break;
  }
};

/** Vérifie la signature d'un webhook et renvoie l'événement typé. */
export const constructEvent = (rawBody: Buffer, signature: string): StripeEvent => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new HttpError(503, 'Webhook Stripe non configuré.');
  }
  const stripe = getStripe();
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new HttpError(400, 'Signature webhook invalide.');
  }
};
