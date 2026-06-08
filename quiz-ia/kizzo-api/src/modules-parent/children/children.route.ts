import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { create, get, list, remove, stats, update } from './children.controller';
import { childIdParamsSchema, createChildSchema, updateChildSchema } from './children.schema';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));

router.get('/', list);
router.post('/', validateResource(createChildSchema), create);

router.get('/:id', validateResource({ params: childIdParamsSchema }), get);
router.patch(
  '/:id',
  validateResource({ params: childIdParamsSchema, body: updateChildSchema }),
  update,
);
router.delete('/:id', validateResource({ params: childIdParamsSchema }), remove);
router.get('/:id/stats', validateResource({ params: childIdParamsSchema }), stats);

export default router;
