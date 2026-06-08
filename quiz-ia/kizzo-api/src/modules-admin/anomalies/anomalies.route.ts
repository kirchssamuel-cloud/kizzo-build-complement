import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { list } from './anomalies.controller';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.administrateur]));

router.get('/', list);

export default router;
