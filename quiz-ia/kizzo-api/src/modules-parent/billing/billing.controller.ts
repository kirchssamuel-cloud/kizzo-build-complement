import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import { HttpError } from '../../middleware/error.middleware';
import * as service from './billing.service';
import type { CreateCheckoutInput } from './billing.schema';

/** POST /api/parent/billing/checkout — crée une session de paiement Stripe. */
export const checkout = asyncHandler(
  async (req: Request<unknown, unknown, CreateCheckoutInput>, res: Response) => {
    const data = await service.createCheckoutSession(req.userId!, req.body.plan);
    return res.status(201).json(data);
  },
);

/** GET /api/parent/billing/status — état de l'abonnement du parent. */
export const status = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getSubscriptionStatus(req.userId!);
  return res.json(data);
});

/**
 * POST /api/billing/webhook — endpoint public appelé par Stripe.
 * Corps brut requis (signature). Pas d'auth JWT : la vérité = la signature.
 */
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    throw new HttpError(400, 'En-tête stripe-signature manquant.');
  }
  // `express.json({ verify })` a capté le corps brut dans req.rawBody.
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    throw new HttpError(400, 'Corps brut indisponible pour la vérification.');
  }

  const event = service.constructEvent(rawBody, signature);
  await service.handleEvent(event);
  return res.json({ received: true });
});
