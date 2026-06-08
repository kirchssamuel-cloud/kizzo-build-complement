import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { list, remove, upsert } from './apps.controller';
import { appRuleParamsSchema, childIdParamsSchema, upsertAppRuleSchema } from './apps.schema';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));

router.get('/:childId', validateResource({ params: childIdParamsSchema }), list);
router.put(
  '/:childId',
  validateResource({ params: childIdParamsSchema, body: upsertAppRuleSchema }),
  upsert,
);
router.delete('/:childId/:bundleId', validateResource({ params: appRuleParamsSchema }), remove);

export default router;
