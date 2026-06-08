import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { list, markAllRead, markRead, remove } from './notifications.controller';
import { listNotifsQuerySchema, notifIdParamsSchema } from './notifications.schema';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));

router.get('/', validateResource({ query: listNotifsQuerySchema }), list);
router.put('/read-all', markAllRead);
router.put('/:id/read', validateResource({ params: notifIdParamsSchema }), markRead);
router.delete('/:id', validateResource({ params: notifIdParamsSchema }), remove);

export default router;
