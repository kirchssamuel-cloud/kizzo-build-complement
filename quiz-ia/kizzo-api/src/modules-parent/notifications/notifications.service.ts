import { TypeNotification } from '@prisma/client';
import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import type { UpdatePreferencesInput } from './notifications.schema';

export const list = async (userId: string, page = 1, pageSize = 20) => {
  const where = { utilisateurId: userId };
  const [total, items] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { dateCreation: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};

export const markAsRead = async (userId: string, notifId: string) => {
  const notif = await prisma.notification.findUnique({ where: { id: notifId } });
  if (!notif) throw new HttpError(404, 'Notification introuvable');
  if (notif.utilisateurId !== userId) throw new HttpError(403, 'Accès refusé');
  return prisma.notification.update({
    where: { id: notifId },
    data: { lue: true, dateLecture: new Date() },
  });
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { utilisateurId: userId, lue: false },
    data: { lue: true, dateLecture: new Date() },
  });
  return { message: 'Toutes les notifications marquées comme lues' };
};

export const remove = async (userId: string, notifId: string) => {
  const notif = await prisma.notification.findUnique({ where: { id: notifId } });
  if (!notif) throw new HttpError(404, 'Notification introuvable');
  if (notif.utilisateurId !== userId) throw new HttpError(403, 'Accès refusé');
  await prisma.notification.delete({ where: { id: notifId } });
  return { message: 'Notification supprimée' };
};

/** Valeurs par défaut d'un type sans préférence enregistrée (push activé, email désactivé). */
const defaultPref = (type: TypeNotification) => ({
  type,
  canalPush: true,
  canalEmail: false,
});

/**
 * Liste les préférences de notification (P34).
 * Complète avec les valeurs par défaut pour tout type non encore configuré,
 * afin que l'app affiche toujours la liste exhaustive des types.
 */
export const getPreferences = async (userId: string) => {
  const enregistrees = await prisma.preferenceNotification.findMany({
    where: { utilisateurId: userId },
  });
  const parType = new Map(enregistrees.map((p) => [p.type, p]));
  return Object.values(TypeNotification).map((type) => {
    const p = parType.get(type);
    return p
      ? { type: p.type, canalPush: p.canalPush, canalEmail: p.canalEmail }
      : defaultPref(type);
  });
};

/** Upsert (par type) des préférences de notification du parent. */
export const updatePreferences = async (
  userId: string,
  input: UpdatePreferencesInput,
) => {
  await prisma.$transaction(
    input.preferences.map((p) =>
      prisma.preferenceNotification.upsert({
        where: { utilisateurId_type: { utilisateurId: userId, type: p.type } },
        create: {
          utilisateurId: userId,
          type: p.type,
          canalPush: p.canalPush,
          canalEmail: p.canalEmail,
        },
        update: { canalPush: p.canalPush, canalEmail: p.canalEmail },
      }),
    ),
  );
  return getPreferences(userId);
};
