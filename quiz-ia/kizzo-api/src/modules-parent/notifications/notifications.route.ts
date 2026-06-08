import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import {
  getPreferences,
  list,
  markAllRead,
  markRead,
  remove,
  updatePreferences,
} from './notifications.controller';
import {
  listNotifsQuerySchema,
  notifIdParamsSchema,
  updatePreferencesSchema,
} from './notifications.schema';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));

// Préférences (P34) — déclarées avant les routes paramétrées /:id.
router.get('/preferences', getPreferences);
router.put(
  '/preferences',
  validateResource({ body: updatePreferencesSchema }),
  updatePreferences,
);

router.get('/', validateResource({ query: listNotifsQuerySchema }), list);
router.put('/read-all', markAllRead);
router.put('/:id/read', validateResource({ params: notifIdParamsSchema }), markRead);
router.delete('/:id', validateResource({ params: notifIdParamsSchema }), remove);

export default router;
