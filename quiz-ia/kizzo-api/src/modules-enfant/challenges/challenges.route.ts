import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { list, start, submit } from './challenges.controller';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.enfant, RoleUtilisateur.parent]));

router.get('/', list);
router.get('/:id', start);
router.post('/:id/submit', submit);

export default router;
