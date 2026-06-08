import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, authHeader, createVerifiedParent } from './helpers';
import prisma from '../src/config/prisma';

// Le client Stripe est entièrement mocké : aucun appel réseau réel.
const { fakeStripe } = vi.hoisted(() => ({
  fakeStripe: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
  },
}));

vi.mock('../src/lib/stripe', () => ({
  getStripe: () => fakeStripe,
}));

beforeEach(() => {
  vi.clearAllMocks();
  fakeStripe.customers.create.mockResolvedValue({ id: 'cus_test_1' });
  fakeStripe.checkout.sessions.create.mockResolvedValue({
    id: 'cs_test_1',
    url: 'https://checkout.stripe.test/cs_test_1',
  });
});

/** Construit un objet subscription Stripe minimal pour le webhook. */
function subscription(opts: {
  customer: string;
  status: string;
  priceId?: string;
  periodEnd?: number;
}) {
  return {
    id: 'sub_test_1',
    customer: opts.customer,
    status: opts.status,
    items: {
      data: [
        {
          current_period_end: opts.periodEnd ?? 1893456000, // 2030-01-01
          price: { id: opts.priceId ?? 'price_famille' },
        },
      ],
    },
  };
}

describe('Billing — checkout', () => {
  it('401 sans token', async () => {
    const res = await api().post('/api/parent/billing/checkout').send({ plan: 'famille' });
    expect(res.status).toBe(401);
  });

  it('crée un client Stripe + une session et persiste le customerId', async () => {
    const parent = await createVerifiedParent();
    const res = await api()
      .post('/api/parent/billing/checkout')
      .set(authHeader(parent.token))
      .send({ plan: 'famille' });

    expect(res.status).toBe(201);
    expect(res.body.url).toContain('checkout.stripe.test');
    expect(fakeStripe.customers.create).toHaveBeenCalledTimes(1);
    expect(fakeStripe.checkout.sessions.create).toHaveBeenCalledTimes(1);

    const user = await prisma.utilisateur.findUnique({ where: { id: parent.userId } });
    expect(user?.stripeCustomerId).toBe('cus_test_1');
  });

  it('réutilise le client Stripe existant', async () => {
    const parent = await createVerifiedParent();
    await prisma.utilisateur.update({
      where: { id: parent.userId },
      data: { stripeCustomerId: 'cus_existing' },
    });

    const res = await api()
      .post('/api/parent/billing/checkout')
      .set(authHeader(parent.token))
      .send({ plan: 'famille_plus' });

    expect(res.status).toBe(201);
    expect(fakeStripe.customers.create).not.toHaveBeenCalled();
    // Le price_id du plus correspond bien au plan demandé.
    const arg = fakeStripe.checkout.sessions.create.mock.calls[0][0];
    expect(arg.line_items[0].price).toBe('price_famille_plus');
    expect(arg.customer).toBe('cus_existing');
  });

  it('refuse un plan invalide (400)', async () => {
    const parent = await createVerifiedParent();
    const res = await api()
      .post('/api/parent/billing/checkout')
      .set(authHeader(parent.token))
      .send({ plan: 'gratuit' });
    expect(res.status).toBe(400);
  });
});

describe('Billing — status', () => {
  it('renvoie le plan gratuit par défaut', async () => {
    const parent = await createVerifiedParent();
    const res = await api()
      .get('/api/parent/billing/status')
      .set(authHeader(parent.token));
    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('gratuit');
    expect(res.body.actif).toBe(false);
  });
});

describe('Billing — webhook', () => {
  it('400 sans en-tête stripe-signature', async () => {
    const res = await api().post('/api/billing/webhook').send({ type: 'ping' });
    expect(res.status).toBe(400);
  });

  it('400 si la signature est invalide', async () => {
    fakeStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('bad sig');
    });
    const res = await api()
      .post('/api/billing/webhook')
      .set('stripe-signature', 't=1,v1=bad')
      .send({ type: 'whatever' });
    expect(res.status).toBe(400);
  });

  it('checkout.session.completed → passe le compte en plan famille', async () => {
    const parent = await createVerifiedParent();
    fakeStripe.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { utilisateurId: parent.userId, plan: 'famille' },
          customer: 'cus_test_1',
          subscription: 'sub_test_1',
        },
      },
    });

    const res = await api()
      .post('/api/billing/webhook')
      .set('stripe-signature', 't=1,v1=ok')
      .send({ any: 'payload' });

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    const user = await prisma.utilisateur.findUnique({ where: { id: parent.userId } });
    expect(user?.plan).toBe('famille');
    expect(user?.statutAbonnement).toBe('active');
    expect(user?.stripeSubscriptionId).toBe('sub_test_1');
  });

  it('customer.subscription.updated (active) → applique le plan + la fin de période', async () => {
    const parent = await createVerifiedParent();
    await prisma.utilisateur.update({
      where: { id: parent.userId },
      data: { stripeCustomerId: 'cus_sub_1' },
    });
    fakeStripe.webhooks.constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: subscription({
          customer: 'cus_sub_1',
          status: 'active',
          priceId: 'price_famille_plus',
        }),
      },
    });

    const res = await api()
      .post('/api/billing/webhook')
      .set('stripe-signature', 't=1,v1=ok')
      .send({ any: 'payload' });

    expect(res.status).toBe(200);
    const user = await prisma.utilisateur.findUnique({ where: { id: parent.userId } });
    expect(user?.plan).toBe('famille_plus');
    expect(user?.statutAbonnement).toBe('active');
    expect(user?.abonnementFinPeriode).toBeTruthy();
  });

  it('customer.subscription.deleted/canceled → retour au plan gratuit', async () => {
    const parent = await createVerifiedParent();
    await prisma.utilisateur.update({
      where: { id: parent.userId },
      data: {
        stripeCustomerId: 'cus_sub_2',
        plan: 'famille',
        statutAbonnement: 'active',
      },
    });
    fakeStripe.webhooks.constructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: subscription({ customer: 'cus_sub_2', status: 'canceled' }),
      },
    });

    const res = await api()
      .post('/api/billing/webhook')
      .set('stripe-signature', 't=1,v1=ok')
      .send({ any: 'payload' });

    expect(res.status).toBe(200);
    const user = await prisma.utilisateur.findUnique({ where: { id: parent.userId } });
    expect(user?.plan).toBe('gratuit');
    expect(user?.statutAbonnement).toBe('canceled');
  });

  it("ignore un type d'événement non géré (200)", async () => {
    const parent = await createVerifiedParent();
    await prisma.utilisateur.update({
      where: { id: parent.userId },
      data: { plan: 'famille' },
    });
    fakeStripe.webhooks.constructEvent.mockReturnValue({
      type: 'invoice.paid',
      data: { object: {} },
    });

    const res = await api()
      .post('/api/billing/webhook')
      .set('stripe-signature', 't=1,v1=ok')
      .send({ any: 'payload' });

    expect(res.status).toBe(200);
    const user = await prisma.utilisateur.findUnique({ where: { id: parent.userId } });
    expect(user?.plan).toBe('famille'); // inchangé
  });

  it('ignore un client Stripe inconnu côté Kizzo (pas de crash)', async () => {
    fakeStripe.webhooks.constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: subscription({ customer: 'cus_inconnu', status: 'active' }) },
    });
    const res = await api()
      .post('/api/billing/webhook')
      .set('stripe-signature', 't=1,v1=ok')
      .send({ any: 'payload' });
    expect(res.status).toBe(200);
  });
});
