import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { resetPairing } from './pairing-reset.controller';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.administrateur]));

router.post('/:id/reset-pairing', resetPairing);

export default router;
