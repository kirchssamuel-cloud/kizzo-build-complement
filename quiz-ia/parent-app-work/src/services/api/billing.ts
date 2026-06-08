import { api } from './client';

// Plans payants exposés au checkout (le plan « gratuit » n'a pas de checkout).
export type PlanPayant = 'famille' | 'famille_plus';
export type PlanAbonnement = 'gratuit' | PlanPayant;

export type SubscriptionStatus = {
  plan: PlanAbonnement;
  statut: string | null; // statut Stripe brut (active, canceled, past_due…) ou null
  finPeriode: string | null; // ISO date de fin de période courante, ou null
  actif: boolean; // abonnement payant en cours
};

export type CheckoutSession = {
  url: string;
  sessionId: string;
};

export const billingApi = {
  status: () =>
    api.get<SubscriptionStatus>('/parent/billing/status').then((r) => r.data),
  checkout: (plan: PlanPayant) =>
    api
      .post<CheckoutSession>('/parent/billing/checkout', { plan })
      .then((r) => r.data),
};
