import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { list, updateStatut } from './users.controller';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.administrateur]));

router.get('/', list);
router.patch('/:id/statut', updateStatut);

export default router;
