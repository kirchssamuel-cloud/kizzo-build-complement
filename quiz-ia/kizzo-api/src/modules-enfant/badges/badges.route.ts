import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { listBadges } from './badges.controller';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.enfant, RoleUtilisateur.parent]));

router.get('/', listBadges);

export default router;
