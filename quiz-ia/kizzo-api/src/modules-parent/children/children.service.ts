import prisma from '../../config/prisma';
import { MAX_CHILDREN_PER_PARENT } from '../../config/consts';
import { HttpError } from '../../middleware/error.middleware';
import { calculerAge } from '../../utils/date';
import type { CreateChildInput, UpdateChildInput } from './children.schema';

const ensureOwnership = async (childId: string, parentId: string) => {
  const profil = await prisma.profilEnfant.findUnique({ where: { id: childId } });
  if (!profil) throw new HttpError(404, 'Profil enfant introuvable');
  if (profil.parentId !== parentId) throw new HttpError(403, 'Accès refusé');
  return profil;
};

export const listChildren = async (parentId: string) => {
  const enfants = await prisma.profilEnfant.findMany({
    where: { parentId },
    orderBy: { dateCreation: 'asc' },
    include: {
      appareils: {
        select: { id: true, nomAffichage: true, plateforme: true, actif: true, derniereSync: true },
      },
    },
  });
  return enfants.map((e) => ({ ...e, age: calculerAge(e.dateNaissance) }));
};

export const createChild = async (parentId: string, input: CreateChildInput) => {
  const count = await prisma.profilEnfant.count({ where: { parentId } });
  if (count >= MAX_CHILDREN_PER_PARENT) {
    throw new HttpError(
      403,
      `Vous avez atteint la limite de ${MAX_CHILDREN_PER_PARENT} profils enfants.`,
    );
  }

  const age = calculerAge(input.dateNaissance);
  if (age < 2 || age > 18) {
    throw new HttpError(400, "L'âge de l'enfant doit être compris entre 2 et 18 ans");
  }

  return prisma.profilEnfant.create({
    data: {
      parentId,
      prenom: input.prenom,
      dateNaissance: input.dateNaissance,
      niveauScolaire: input.niveauScolaire,
      avatarId: input.avatarId,
      couleurTheme: input.couleurTheme,
      filtreContenu: { create: {} },
    },
    include: { filtreContenu: true },
  });
};

export const getChild = async (parentId: string, childId: string) => {
  const profil = await ensureOwnership(childId, parentId);
  const enrichi = await prisma.profilEnfant.findUnique({
    where: { id: profil.id },
    include: {
      appareils: true,
      reglesTempsEcran: true,
      filtreContenu: true,
    },
  });
  return enrichi ? { ...enrichi, age: calculerAge(enrichi.dateNaissance) } : null;
};

export const updateChild = async (parentId: string, childId: string, input: UpdateChildInput) => {
  await ensureOwnership(childId, parentId);
  return prisma.profilEnfant.update({
    where: { id: childId },
    data: {
      prenom: input.prenom,
      dateNaissance: input.dateNaissance,
      niveauScolaire: input.niveauScolaire,
      avatarId: input.avatarId,
      couleurTheme: input.couleurTheme,
    },
  });
};

export const deleteChild = async (parentId: string, childId: string) => {
  await ensureOwnership(childId, parentId);
  await prisma.profilEnfant.delete({ where: { id: childId } });
  return { message: 'Profil supprimé' };
};

export const getChildStats = async (parentId: string, childId: string) => {
  await ensureOwnership(childId, parentId);
  const debut = new Date();
  debut.setUTCHours(0, 0, 0, 0);

  const [usagesAujourdhui, defisAujourdhui, badgesTotal] = await Promise.all([
    prisma.usageApp.findMany({
      where: { profilEnfantId: childId, jour: debut },
      orderBy: { dureeSeconds: 'desc' },
      take: 5,
    }),
    prisma.tentativeDefi.count({
      where: { profilEnfantId: childId, dateTentative: { gte: debut } },
    }),
    prisma.badge.count({ where: { profilEnfantId: childId } }),
  ]);

  const tempsTotalSeconds = usagesAujourdhui.reduce((acc, u) => acc + u.dureeSeconds, 0);

  return {
    tempsEcranAujourdhuiSeconds: tempsTotalSeconds,
    topApps: usagesAujourdhui,
    nombreDefisAujourdhui: defisAujourdhui,
    nombreBadges: badgesTotal,
  };
};
