import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import { calculerAge } from '../../utils/date';
import type { UpdateWebFilterInput } from './web-filter.schema';

const ensureOwnership = async (childId: string, parentId: string) => {
  const profil = await prisma.profilEnfant.findUnique({ where: { id: childId } });
  if (!profil) throw new HttpError(404, 'Profil enfant introuvable');
  if (profil.parentId !== parentId) throw new HttpError(403, 'Accès refusé');
  return profil;
};

const DEFAULTS = {
  niveau: 'modere' as const,
  categoriesBloquees: [] as string[],
  whitelistUrls: [] as string[],
  blacklistUrls: [] as string[],
  safeSearch: true,
};

export const getFilter = async (parentId: string, childId: string) => {
  await ensureOwnership(childId, parentId);
  const filtre = await prisma.filtreContenu.findUnique({
    where: { profilEnfantId: childId },
  });
  return filtre ?? { profilEnfantId: childId, ...DEFAULTS };
};

export const updateFilter = async (
  parentId: string,
  childId: string,
  input: UpdateWebFilterInput,
) => {
  const profil = await ensureOwnership(childId, parentId);

  // CDC §17 : SafeSearch non désactivable pour les moins de 12 ans.
  const age = calculerAge(profil.dateNaissance);
  const safeSearch = age < 12 ? true : (input.safeSearch ?? true);

  const data = {
    niveau: input.niveau,
    categoriesBloquees: input.categoriesBloquees ?? [],
    whitelistUrls: input.whitelistUrls ?? [],
    blacklistUrls: input.blacklistUrls ?? [],
    safeSearch,
  };

  return prisma.filtreContenu.upsert({
    where: { profilEnfantId: childId },
    create: { profilEnfantId: childId, ...data },
    update: data,
  });
};
