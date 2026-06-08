import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { list, register, unregister } from './push-tokens.controller';
import {
  registerPushTokenSchema,
  unregisterPushTokenSchema,
} from './push-tokens.schema';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));

router.get('/', list);
router.post(
  '/',
  validateResource({ body: registerPushTokenSchema }),
  register,
);
router.post(
  '/unregister',
  validateResource({ body: unregisterPushTokenSchema }),
  unregister,
);

export default router;
