import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { report } from './activity.controller';
import { childIdParamsSchema, reportQuerySchema } from './activity.schema';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));

router.get(
  '/:childId/report',
  validateResource({ params: childIdParamsSchema, query: reportQuerySchema }),
  report,
);

export default router;
