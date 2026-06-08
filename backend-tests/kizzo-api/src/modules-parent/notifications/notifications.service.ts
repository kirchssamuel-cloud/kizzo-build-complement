import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';

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
