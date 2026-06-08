import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import type { HeartbeatInput } from './device-state.schema';

const ensureOwnership = async (childId: string, parentId: string) => {
  const profil = await prisma.profilEnfant.findUnique({ where: { id: childId } });
  if (!profil) throw new HttpError(404, 'Profil enfant introuvable');
  if (profil.parentId !== parentId) throw new HttpError(403, 'Accès refusé');
  return profil;
};

/** Champs renvoyés au parent (on ne fuite pas le token push). */
const publicDevice = {
  id: true,
  profilEnfantId: true,
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
} as const;

/**
 * Heartbeat envoyé par l'appareil enfant.
 * `parentId` provient du JWT (le token enfant porte l'id du parent — cf. pairChildDevice).
 * `appareilId` provient du header X-Kizzo-Appareil-Id.
 */
export const heartbeat = async (
  parentId: string,
  appareilId: string,
  input: HeartbeatInput,
) => {
  const appareil = await prisma.appareil.findUnique({
    where: { id: appareilId },
    include: { profilEnfant: true },
  });
  if (!appareil) throw new HttpError(404, 'Appareil introuvable');
  if (appareil.profilEnfant.parentId !== parentId) {
    throw new HttpError(403, 'Accès refusé');
  }

  // Ne mettre à jour que les champs fournis (heartbeat partiel autorisé).
  const data: Record<string, unknown> = { derniereSync: new Date(), actif: true };
  if (input.versionApp !== undefined) data.versionApp = input.versionApp;
  if (input.versionOs !== undefined) data.versionOs = input.versionOs;
  if (input.modele !== undefined) data.modele = input.modele;
  if (input.tokenPush !== undefined) data.tokenPush = input.tokenPush;
  if (input.vpnActif !== undefined) data.vpnActif = input.vpnActif;
  if (input.modeSupervise !== undefined) data.modeSupervise = input.modeSupervise;
  if (input.permissionStore !== undefined) data.permissionStore = input.permissionStore;

  return prisma.appareil.update({
    where: { id: appareilId },
    data,
    select: publicDevice,
  });
};

/** Lecture par le parent de l'état des appareils d'un enfant. */
export const getDeviceStates = async (parentId: string, childId: string) => {
  await ensureOwnership(childId, parentId);
  return prisma.appareil.findMany({
    where: { profilEnfantId: childId },
    select: publicDevice,
    orderBy: { dateAppairage: 'asc' },
  });
};
