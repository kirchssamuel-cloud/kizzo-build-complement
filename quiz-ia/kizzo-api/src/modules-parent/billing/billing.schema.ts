import { z } from 'zod';

/** Plans payants éligibles au checkout Stripe (le plan `gratuit` n'a pas de prix). */
export const PLANS_PAYANTS = ['famille', 'famille_plus'] as const;
export type PlanPayant = (typeof PLANS_PAYANTS)[number];

export const createCheckoutSchema = z.object({
  plan: z.enum(PLANS_PAYANTS),
});
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
