import type { Request } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { HttpError } from '../middleware/error.middleware';

/**
 * Garde-fou back-office (défense en profondeur).
 *
 * Les routes admin sont déjà protégées par
 * `authenticateToken([RoleUtilisateur.administrateur])`, mais on revérifie le
 * rôle au niveau du contrôleur pour qu'aucune écriture/lecture admin ne puisse
 * s'exécuter si la garde de route venait à être mal montée.
 */
export const ensureAdminScope = (req: Request): void => {
  if (req.utilisateur?.role !== RoleUtilisateur.administrateur) {
    throw new HttpError(403, 'Accès refusé : réservé aux administrateurs');
  }
};
