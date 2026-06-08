import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/async-handler';

const router = Router();

router.get(
  '/me',
  authenticateToken([RoleUtilisateur.administrateur]),
  asyncHandler(async (req, res) => res.json({ utilisateur: req.utilisateur })),
);

export default router;
