import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { create } from './requests.controller';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.enfant, RoleUtilisateur.parent]));

router.post('/', create);

export default router;
