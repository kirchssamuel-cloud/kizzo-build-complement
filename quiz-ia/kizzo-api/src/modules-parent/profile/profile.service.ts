import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import type { DeleteAccountInput, UpdateProfileInput } from './profile.schema';

const publicProfile = {
  id: true,
  email: true,
  role: true,
  statut: true,
  prenom: true,
  nom: true,
  telephone: true,
  avatarUrl: true,
  plan: true,
  langue: true,
  emailVerifie: true,
  dateCreation: true,
} as const;

export const getProfile = async (parentId: string) => {
  const user = await prisma.utilisateur.findUnique({
    where: { id: parentId },
    select: publicProfile,
  });
  if (!user) throw new HttpError(404, 'Compte introuvable');
  return user;
};

export const updateProfile = async (parentId: string, input: UpdateProfileInput) => {
  return prisma.utilisateur.update({
    where: { id: parentId },
    data: input,
    select: publicProfile,
  });
};

/**
 * Export RGPD des données personnelles (droit à la portabilité, RGPD art. 20 / CDC §18).
 * Retourne un instantané structuré de toutes les données du parent + de ses enfants.
 * Aucune donnée d'un autre parent n'est accessible (tout est filtré par parentId).
 */
export const exportData = async (parentId: string) => {
  const user = await prisma.utilisateur.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      email: true,
      role: true,
      statut: true,
      prenom: true,
      nom: true,
      telephone: true,
      avatarUrl: true,
      plan: true,
      langue: true,
      emailVerifie: true,
      dateCreation: true,
      dateMiseAJour: true,
      preferencesNotifications: true,
    },
  });
  if (!user) throw new HttpError(404, 'Compte introuvable');

  const enfants = await prisma.profilEnfant.findMany({
    where: { parentId },
    include: {
      appareils: {
        select: {
          id: true,
          nomAffichage: true,
          plateforme: true,
          modele: true,
          versionOs: true,
          versionApp: true,
          actif: true,
          derniereSync: true,
          dateAppairage: true,
          modeSupervise: true,
          vpnActif: true,
          permissionStore: true,
        },
      },
      reglesTempsEcran: true,
      filtreContenu: true,
      tentativesDefis: true,
      usagesApps: true,
      visitesWeb: true,
      badges: true,
      demandesTemps: true,
      recommandationsIa: true,
    },
  });

  // On ne fuite jamais le PIN enfant ni les tokens push (déjà exclus des selects appareils).
  const enfantsExport = enfants.map(({ pinEnfant: _pin, ...rest }) => rest);

  return {
    genereLe: new Date().toISOString(),
    format: 'kizzo-export-v1',
    parent: user,
    enfants: enfantsExport,
  };
};

/**
 * Suppression de compte RGPD (droit à l'effacement, CDC §18).
 * - Vérifie le mot de passe si le compte en possède un.
 * - Supprime en cascade les profils enfants (et leurs données via onDelete: Cascade).
 * - Anonymise les PII du parent et marque le compte comme supprimé (rétention légale).
 */
export const deleteAccount = async (parentId: string, input: DeleteAccountInput) => {
  const user = await prisma.utilisateur.findUnique({ where: { id: parentId } });
  if (!user) throw new HttpError(404, 'Compte introuvable');

  if (user.motDePasse) {
    if (!input.password) throw new HttpError(400, 'Mot de passe requis');
    const ok = await bcrypt.compare(input.password, user.motDePasse);
    if (!ok) throw new HttpError(401, 'Mot de passe incorrect');
  }

  await prisma.$transaction([
    prisma.profilEnfant.deleteMany({ where: { parentId } }),
    prisma.utilisateur.update({
      where: { id: parentId },
      data: {
        statut: 'supprime',
        dateSuppression: new Date(),
        email: `deleted-${parentId}@kizzo.invalid`,
        motDePasse: null,
        prenom: null,
        nom: null,
        telephone: null,
        avatarUrl: null,
        codeVerificationEmail: null,
        codeReinitialisationMdp: null,
      },
    }),
  ]);
};
