import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { list, detail, update } from './devices.controller';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.administrateur]));

router.get('/', list);
router.get('/:id', detail);
router.patch('/:id', update);

export default router;
