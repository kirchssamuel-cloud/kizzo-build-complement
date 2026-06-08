import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { get, update } from './web-filter.controller';
import { childIdParamsSchema, updateWebFilterSchema } from './web-filter.schema';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));

router.get('/:childId', validateResource({ params: childIdParamsSchema }), get);
router.put(
  '/:childId',
  validateResource({ params: childIdParamsSchema, body: updateWebFilterSchema }),
  update,
);

export default router;
