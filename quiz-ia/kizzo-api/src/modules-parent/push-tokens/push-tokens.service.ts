import prisma from '../../config/prisma';
import type { RegisterPushTokenInput } from './push-tokens.schema';

/** Champs renvoyés au client (on ne renvoie pas l'id interne). */
const publicToken = {
  token: true,
  plateforme: true,
  langue: true,
  derniereUtilisation: true,
} as const;

/**
 * Enregistre (ou rafraîchit) le token push d'un appareil parent.
 *
 * Upsert sur `token` (unique global) : si l'appareil change de compte parent,
 * le token est ré-affecté au parent courant. `derniereUtilisation` est mis à
 * jour à chaque appel, ce qui permet ensuite de purger les tokens dormants.
 */
export const registerToken = async (
  userId: string,
  input: RegisterPushTokenInput,
) => {
  return prisma.appareilPush.upsert({
    where: { token: input.token },
    create: {
      utilisateurId: userId,
      token: input.token,
      plateforme: input.plateforme,
      langue: input.langue ?? null,
    },
    update: {
      utilisateurId: userId,
      plateforme: input.plateforme,
      langue: input.langue ?? null,
      derniereUtilisation: new Date(),
    },
    select: publicToken,
  });
};

/**
 * Désenregistre un token (déconnexion / désinstallation).
 * Idempotent et scoping strict : on ne supprime que si le token appartient au
 * parent courant (un parent ne peut pas supprimer le token d'un autre compte).
 * Retourne le nombre de tokens effectivement supprimés (0 ou 1).
 */
export const unregisterToken = async (userId: string, token: string) => {
  const { count } = await prisma.appareilPush.deleteMany({
    where: { token, utilisateurId: userId },
  });
  return { supprime: count };
};

/** Liste les tokens push actifs du parent (diagnostic / multi-appareils). */
export const listTokens = async (userId: string) => {
  return prisma.appareilPush.findMany({
    where: { utilisateurId: userId },
    select: publicToken,
    orderBy: { derniereUtilisation: 'desc' },
  });
};
