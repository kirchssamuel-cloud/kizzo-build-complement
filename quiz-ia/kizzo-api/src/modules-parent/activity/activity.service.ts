import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import { bucketJour } from '../../utils/date';

const ensureOwnership = async (childId: string, parentId: string) => {
  const profil = await prisma.profilEnfant.findUnique({ where: { id: childId } });
  if (!profil) throw new HttpError(404, 'Profil enfant introuvable');
  if (profil.parentId !== parentId) throw new HttpError(403, 'Accès refusé');
};

export const getReport = async (parentId: string, childId: string, jours: number) => {
  await ensureOwnership(childId, parentId);

  const depuis = bucketJour();
  depuis.setUTCDate(depuis.getUTCDate() - (jours - 1));

  const [usages, visites, tentatives] = await Promise.all([
    prisma.usageApp.findMany({
      where: { profilEnfantId: childId, jour: { gte: depuis } },
      orderBy: { dureeSeconds: 'desc' },
    }),
    prisma.visiteWeb.findMany({
      where: { profilEnfantId: childId, jour: { gte: depuis } },
      orderBy: { nombreVisites: 'desc' },
    }),
    prisma.tentativeDefi.findMany({
      where: { profilEnfantId: childId, dateTentative: { gte: depuis } },
      orderBy: { dateTentative: 'desc' },
    }),
  ]);

  const totalEcranSeconds = usages.reduce((acc, u) => acc + u.dureeSeconds, 0);
  const totalVisites = visites.reduce((acc, v) => acc + v.nombreVisites, 0);
  const visitesBloquees = visites.filter((v) => v.bloque).reduce((a, v) => a + v.nombreVisites, 0);
  const quizReussis = tentatives.filter((t) => t.reussi).length;
  const tempsGagneSeconds = tentatives.reduce((acc, t) => acc + t.tempsCredite, 0);
  const scoreMoyen = tentatives.length
    ? Math.round(tentatives.reduce((a, t) => a + t.score, 0) / tentatives.length)
    : 0;

  return {
    periode: { depuis, jours },
    ecran: { totalSeconds: totalEcranSeconds, apps: usages },
    web: { totalVisites, visitesBloquees, domaines: visites },
    quiz: {
      total: tentatives.length,
      reussis: quizReussis,
      scoreMoyen,
      tempsGagneSeconds,
      tentatives,
    },
  };
};
