import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import { bucketJour } from '../../utils/date';
import type { AddTimeInput, UpsertRuleInput } from './screen-time.schema';

const ensureOwnership = async (childId: string, parentId: string) => {
  const profil = await prisma.profilEnfant.findUnique({ where: { id: childId } });
  if (!profil) throw new HttpError(404, 'Profil enfant introuvable');
  if (profil.parentId !== parentId) throw new HttpError(403, 'Accès refusé');
};

export const listRules = async (parentId: string, childId: string) => {
  await ensureOwnership(childId, parentId);
  return prisma.regleTempsEcran.findMany({
    where: { profilEnfantId: childId },
    orderBy: { jourSemaine: 'asc' },
  });
};

export const upsertRule = async (
  parentId: string,
  childId: string,
  input: UpsertRuleInput,
) => {
  await ensureOwnership(childId, parentId);
  return prisma.regleTempsEcran.upsert({
    where: {
      profilEnfantId_jourSemaine: {
        profilEnfantId: childId,
        jourSemaine: input.jourSemaine,
      },
    },
    create: {
      profilEnfantId: childId,
      jourSemaine: input.jourSemaine,
      minutesMatin: input.minutesMatin,
      minutesApresMidi: input.minutesApresMidi,
      minutesSoir: input.minutesSoir,
      modeNuitActif: input.modeNuitActif,
      modeNuitDebut: input.modeNuitDebut,
      modeNuitFin: input.modeNuitFin,
    },
    update: {
      minutesMatin: input.minutesMatin,
      minutesApresMidi: input.minutesApresMidi,
      minutesSoir: input.minutesSoir,
      modeNuitActif: input.modeNuitActif,
      modeNuitDebut: input.modeNuitDebut,
      modeNuitFin: input.modeNuitFin,
    },
  });
};

export const addTime = async (parentId: string, childId: string, input: AddTimeInput) => {
  await ensureOwnership(childId, parentId);
  return prisma.ajoutTempsEcran.create({
    data: {
      profilEnfantId: childId,
      parentId,
      minutes: input.minutes,
      raison: input.raison,
    },
  });
};

export const getUsageToday = async (parentId: string, childId: string) => {
  await ensureOwnership(childId, parentId);
  const jour = bucketJour();
  const usages = await prisma.usageApp.findMany({
    where: { profilEnfantId: childId, jour },
    orderBy: { dureeSeconds: 'desc' },
  });
  const totalSeconds = usages.reduce((acc, u) => acc + u.dureeSeconds, 0);
  return { jour, totalSeconds, apps: usages };
};
