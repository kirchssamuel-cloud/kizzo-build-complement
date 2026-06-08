import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { exportData, get, remove, update } from './profile.controller';
import { deleteAccountSchema, updateProfileSchema } from './profile.schema';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));

router.get('/profile', get);
router.put('/profile', validateResource({ body: updateProfileSchema }), update);
router.get('/account/export', exportData);
router.delete('/account', validateResource({ body: deleteAccountSchema }), remove);

export default router;
