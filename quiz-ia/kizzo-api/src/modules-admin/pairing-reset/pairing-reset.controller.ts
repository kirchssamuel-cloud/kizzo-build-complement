import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import { ensureAdminScope } from '../admin-scope';

/**
 * Réinitialisation d'appairage back-office.
 *
 * Désappaire TOUS les appareils des enfants du parent visé : on coupe l'accès
 * (`actif=false`), on purge le `tokenPush` et le code d'appairage. Le parent
 * devra ré-appairer chaque appareil depuis l'app. Utile en cas de perte/vol ou
 * de support (RG back-office).
 */

export const resetPairing = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  ensureAdminScope(req);

  const parent = await prisma.utilisateur.findUnique({
    where: { id: req.params.id },
    select: { id: true, profilsEnfants: { select: { id: true } } },
  });
  if (!parent) throw new HttpError(404, 'Utilisateur introuvable');

  const profilIds = parent.profilsEnfants.map((e) => e.id);
  if (profilIds.length === 0) {
    return res.json({ reset: 0 });
  }

  const result = await prisma.appareil.updateMany({
    where: { profilEnfantId: { in: profilIds } },
    data: { actif: false, tokenPush: null, codeAppairage: null, dateCodeAppairage: null },
  });

  return res.json({ reset: result.count });
});
