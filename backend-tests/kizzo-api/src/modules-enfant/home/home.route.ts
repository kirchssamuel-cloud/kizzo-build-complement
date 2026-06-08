import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { homeState } from './home.controller';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.enfant, RoleUtilisateur.parent]));

router.get('/state', homeState);

export default router;
