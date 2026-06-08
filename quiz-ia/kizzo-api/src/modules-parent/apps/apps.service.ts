import type { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import type { UpsertAppRuleInput } from './apps.schema';

const ensureOwnership = async (childId: string, parentId: string) => {
  const profil = await prisma.profilEnfant.findUnique({ where: { id: childId } });
  if (!profil) throw new HttpError(404, 'Profil enfant introuvable');
  if (profil.parentId !== parentId) throw new HttpError(403, 'Accès refusé');
};

export const listApps = async (parentId: string, childId: string) => {
  await ensureOwnership(childId, parentId);
  return prisma.regleApp.findMany({
    where: { profilEnfantId: childId },
    orderBy: [{ categorie: 'asc' }, { nomApp: 'asc' }],
  });
};

export const upsertApp = async (
  parentId: string,
  childId: string,
  input: UpsertAppRuleInput,
) => {
  await ensureOwnership(childId, parentId);
  const data = {
    nomApp: input.nomApp,
    categorie: input.categorie,
    autorisee: input.autorisee,
    limiteQuotidienne: input.limiteQuotidienne ?? null,
    plagesHoraires: (input.plagesHoraires ?? null) as Prisma.InputJsonValue,
  };
  return prisma.regleApp.upsert({
    where: {
      profilEnfantId_bundleId: { profilEnfantId: childId, bundleId: input.bundleId },
    },
    create: { profilEnfantId: childId, bundleId: input.bundleId, ...data },
    update: data,
  });
};

export const deleteApp = async (parentId: string, childId: string, bundleId: string) => {
  await ensureOwnership(childId, parentId);
  const existing = await prisma.regleApp.findUnique({
    where: { profilEnfantId_bundleId: { profilEnfantId: childId, bundleId } },
  });
  if (!existing) throw new HttpError(404, 'Règle introuvable');
  await prisma.regleApp.delete({
    where: { profilEnfantId_bundleId: { profilEnfantId: childId, bundleId } },
  });
};
