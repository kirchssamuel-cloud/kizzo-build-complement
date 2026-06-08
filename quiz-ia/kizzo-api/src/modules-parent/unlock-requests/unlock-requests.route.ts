import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { list, respond } from './unlock-requests.controller';
import {
  demandeIdParamsSchema,
  listRequestsQuerySchema,
  respondRequestSchema,
} from './unlock-requests.schema';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));

router.get('/', validateResource({ query: listRequestsQuerySchema }), list);
router.post(
  '/:demandeId/respond',
  validateResource({ params: demandeIdParamsSchema, body: respondRequestSchema }),
  respond,
);

export default router;
