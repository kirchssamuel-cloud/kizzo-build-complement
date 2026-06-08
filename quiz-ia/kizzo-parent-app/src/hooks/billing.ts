import { useMutation, useQuery } from '@tanstack/react-query';
import { billingApi, type PlanPayant } from '~/services/api/billing';

export const billingKeys = {
  status: ['billing-status'] as const,
};

// État d'abonnement du parent (P33).
export const useBillingStatus = () =>
  useQuery({ queryKey: billingKeys.status, queryFn: () => billingApi.status() });

// Crée une session Stripe Checkout et renvoie l'URL hébergée à ouvrir.
export const useCheckout = () =>
  useMutation({ mutationFn: (plan: PlanPayant) => billingApi.checkout(plan) });
