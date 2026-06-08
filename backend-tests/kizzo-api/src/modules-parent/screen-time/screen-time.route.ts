import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { addTime, list, upsert, usage } from './screen-time.controller';
import { addTimeSchema, childIdParamsSchema, upsertRuleSchema } from './screen-time.schema';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));

router.get('/:childId', validateResource({ params: childIdParamsSchema }), list);
router.put(
  '/:childId',
  validateResource({ params: childIdParamsSchema, body: upsertRuleSchema }),
  upsert,
);
router.post(
  '/:childId/add-time',
  validateResource({ params: childIdParamsSchema, body: addTimeSchema }),
  addTime,
);
router.get('/:childId/usage', validateResource({ params: childIdParamsSchema }), usage);

export default router;
