import StripeLib from 'stripe';
import { env } from '../config/env';
import { HttpError } from '../middleware/error.middleware';

let client: StripeLib.Stripe | null = null;

/**
 * Retourne le client Stripe (singleton). La clé secrète reste strictement côté
 * serveur — jamais exposée au mobile. Lève 503 si Stripe n'est pas configuré
 * (ex. environnement de dev/test sans clé), pour éviter des appels réseau muets.
 */
export const getStripe = (): StripeLib.Stripe => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new HttpError(503, 'Paiement indisponible (Stripe non configuré).');
  }
  if (!client) {
    // apiVersion omis volontairement → la SDK utilise sa version épinglée.
    client = new StripeLib(env.STRIPE_SECRET_KEY);
  }
  return client;
};

// ── Types Stripe dérivés ──────────────────────────────────────────────────────
// Le packaging CJS de stripe@22 n'expose pas le namespace `Stripe.*` des
// ressources via l'import par défaut. On dérive donc les quelques types utilisés
// depuis l'instance (indexed access), ce qui reste 100 % type-safe.
export type StripeInstance = StripeLib.Stripe;
export type StripeEvent = ReturnType<StripeInstance['webhooks']['constructEvent']>;
export type StripeSubscription = Extract<
  StripeEvent,
  { type: 'customer.subscription.updated' }
>['data']['object'];
export type StripeCheckoutSession = Extract<
  StripeEvent,
  { type: 'checkout.session.completed' }
>['data']['object'];
