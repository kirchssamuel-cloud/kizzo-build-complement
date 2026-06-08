import prisma from '../../config/prisma';
import {
  DEVICE_PAIRING_CODE_TTL_MS,
  MAX_DEVICES_PER_CHILD,
} from '../../config/consts';
import { HttpError } from '../../middleware/error.middleware';
import { generateNumericCode } from '../../utils/random';
import { Plateforme } from '@prisma/client';
import { logger } from '../../config/logger';
import { sendPushToChild } from '../../lib/push';

const ensureChildOwnership = async (childId: string, parentId: string) => {
  const profil = await prisma.profilEnfant.findUnique({ where: { id: childId } });
  if (!profil) throw new HttpError(404, 'Profil enfant introuvable');
  if (profil.parentId !== parentId) throw new HttpError(403, 'Accès refusé');
};

export const generatePairingCode = async (parentId: string, profilEnfantId: string) => {
  await ensureChildOwnership(profilEnfantId, parentId);

  const count = await prisma.appareil.count({ where: { profilEnfantId, actif: true } });
  if (count >= MAX_DEVICES_PER_CHILD) {
    throw new HttpError(
      403,
      `Limite de ${MAX_DEVICES_PER_CHILD} appareils actifs par enfant atteinte.`,
    );
  }

  let code = generateNumericCode();
    for (let i = 0; i < 5; i++) {
    const dup = await prisma.appareil.findUnique({ where: { codeAppairage: code } });
    if (!dup) break;
    code = generateNumericCode();
  }

  const appareil = await prisma.appareil.create({
    data: {
      profilEnfantId,
      nomAffichage: 'Nouvel appareil',
      plateforme: Plateforme.android,
      actif: false,
      codeAppairage: code,
      dateCodeAppairage: new Date(),
    },
  });

  return {
    appareilId: appareil.id,
    code,
    expireDansMs: DEVICE_PAIRING_CODE_TTL_MS,
  };
};

export const listDevices = async (parentId: string) => {
  return prisma.appareil.findMany({
    where: { profilEnfant: { parentId } },
    orderBy: { dateAppairage: 'desc' },
  });
};

export const lockDevice = async (parentId: string, deviceId: string, message?: string) => {
  const appareil = await prisma.appareil.findUnique({
    where: { id: deviceId },
    include: { profilEnfant: true },
  });
  if (!appareil) throw new HttpError(404, 'Appareil introuvable');
  if (appareil.profilEnfant.parentId !== parentId) throw new HttpError(403, 'Accès refusé');

   await prisma.notification.create({
    data: {
      utilisateurId: parentId,
      profilEnfantId: appareil.profilEnfantId,
      type: 'systeme',
      niveau: 'critique',
      titre: 'Verrouillage demandé',
      corps: message ?? 'Verrouillage demandé par le parent',
      donnees: { action: 'lockNow', appareilId: deviceId },
    },
  });

  // Push temps réel vers l'appareil enfant (non bloquant : un échec push ne doit
  // pas faire échouer la commande de verrouillage).
  try {
    await sendPushToChild(appareil.profilEnfantId, {
      titre: 'Verrouillage demandé',
      corps: message ?? 'Tes parents ont verrouillé cet appareil.',
      donnees: { action: 'lockNow', appareilId: deviceId },
    });
  } catch (err) {
    logger.error({ err, deviceId }, 'Échec envoi push lockNow');
  }

  return { message: 'Demande de verrouillage envoyée à l\'appareil' };
};

export const unpairDevice = async (parentId: string, deviceId: string) => {
  const appareil = await prisma.appareil.findUnique({
    where: { id: deviceId },
    include: { profilEnfant: true },
  });
  if (!appareil) throw new HttpError(404, 'Appareil introuvable');
  if (appareil.profilEnfant.parentId !== parentId) throw new HttpError(403, 'Accès refusé');

  await prisma.appareil.update({
    where: { id: deviceId },
    data: { actif: false, tokenPush: null },
  });
  return { message: 'Appareil désassocié' };
};
