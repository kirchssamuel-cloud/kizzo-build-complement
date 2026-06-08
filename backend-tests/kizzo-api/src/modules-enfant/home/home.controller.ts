import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import { bucketJour } from '../../utils/date';

export const homeState = asyncHandler(async (req: Request, res: Response) => {
  const appareilId = req.headers['x-kizzo-appareil-id'];
  if (!appareilId || typeof appareilId !== 'string') {
    throw new HttpError(400, "Header X-Kizzo-Appareil-Id manquant");
  }
  const appareil = await prisma.appareil.findUnique({
    where: { id: appareilId },
    include: { profilEnfant: true },
  });
  if (!appareil) throw new HttpError(404, 'Appareil introuvable');

  const profilEnfant = appareil.profilEnfant;
  if (profilEnfant.parentId !== req.userId) {
    throw new HttpError(403, 'Accès refusé');
  }

  const jour = bucketJour();
  const [usages, badgesCount, defisAujourdhui] = await Promise.all([
    prisma.usageApp.findMany({ where: { profilEnfantId: profilEnfant.id, jour } }),
    prisma.badge.count({ where: { profilEnfantId: profilEnfant.id } }),
    prisma.tentativeDefi.count({
      where: { profilEnfantId: profilEnfant.id, dateTentative: { gte: jour } },
    }),
  ]);
  const tempsUtiliseSeconds = usages.reduce((acc, u) => acc + u.dureeSeconds, 0);

  return res.json({
    profilEnfant: {
      id: profilEnfant.id,
      prenom: profilEnfant.prenom,
      avatarId: profilEnfant.avatarId,
      couleurTheme: profilEnfant.couleurTheme,
      niveauScolaire: profilEnfant.niveauScolaire,
    },
    tempsUtiliseSeconds,
    nombreBadges: badgesCount,
    nombreDefisAujourdhui: defisAujourdhui,
  });
});
