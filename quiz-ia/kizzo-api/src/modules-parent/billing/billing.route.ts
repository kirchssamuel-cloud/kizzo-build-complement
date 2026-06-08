import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { checkout, status, webhook } from './billing.controller';
import { createCheckoutSchema } from './billing.schema';

/** Routes parent (auth requise) : checkout + état d'abonnement. */
const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));
router.post('/checkout', validateResource(createCheckoutSchema), checkout);
router.get('/status', status);

/** Route webhook publique (signature Stripe, pas de JWT). Montée séparément. */
export const billingWebhookRouter = Router();
billingWebhookRouter.post('/', webhook);

export default router;
