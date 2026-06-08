import { describe, expect, it } from 'vitest';
import prisma from '../src/config/prisma';
import { api, authHeader, createVerifiedParent } from './helpers';

/**
 * Crée `n` notifications en base pour un utilisateur (pas d'endpoint public de
 * création — les notifications sont produites par le serveur). On s'appuie donc
 * sur Prisma directement pour le seed, conformément au pattern des helpers.
 */
async function seedNotifs(userId: string, n: number) {
  for (let i = 0; i < n; i += 1) {
    await prisma.notification.create({
      data: {
        utilisateurId: userId,
        type: 'systeme',
        niveau: 'info',
        titre: `Notif ${i}`,
        corps: `Corps de la notification ${i}`,
      },
    });
  }
}

describe('Liste notifications /api/parent/notifications (P33)', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().get('/api/parent/notifications?page=1&pageSize=20');
    expect(res.status).toBe(401);
  });

  it('exige des paramètres de pagination valides (400)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api()
      .get('/api/parent/notifications?page=0&pageSize=20')
      .set(authHeader(token));
    expect(res.status).toBe(400);
  });

  it('retourne une page vide quand aucune notification', async () => {
    const { token } = await createVerifiedParent();
    const res = await api()
      .get('/api/parent/notifications?page=1&pageSize=20')
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.totalPages).toBe(0);
  });

  it('pagine correctement (total, pageSize, totalPages)', async () => {
    const { token, userId } = await createVerifiedParent();
    await seedNotifs(userId, 5);

    const page1 = await api()
      .get('/api/parent/notifications?page=1&pageSize=2')
      .set(authHeader(token));
    expect(page1.status).toBe(200);
    expect(page1.body.total).toBe(5);
    expect(page1.body.pageSize).toBe(2);
    expect(page1.body.totalPages).toBe(3);
    expect(page1.body.items).toHaveLength(2);

    const page3 = await api()
      .get('/api/parent/notifications?page=3&pageSize=2')
      .set(authHeader(token));
    expect(page3.body.items).toHaveLength(1);
  });

  it('marque une notification comme lue', async () => {
    const { token, userId } = await createVerifiedParent();
    await seedNotifs(userId, 1);
    const list = await api()
      .get('/api/parent/notifications?page=1&pageSize=20')
      .set(authHeader(token));
    const id = list.body.items[0].id as string;
    expect(list.body.items[0].lue).toBe(false);

    const res = await api()
      .put(`/api/parent/notifications/${id}/read`)
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.notification.lue).toBe(true);
    expect(res.body.notification.dateLecture).not.toBeNull();
  });

  it('marque toutes les notifications comme lues', async () => {
    const { token, userId } = await createVerifiedParent();
    await seedNotifs(userId, 3);

    const res = await api()
      .put('/api/parent/notifications/read-all')
      .set(authHeader(token));
    expect(res.status).toBe(200);

    const nonLues = await prisma.notification.count({
      where: { utilisateurId: userId, lue: false },
    });
    expect(nonLues).toBe(0);
  });

  it('supprime une notification', async () => {
    const { token, userId } = await createVerifiedParent();
    await seedNotifs(userId, 2);
    const list = await api()
      .get('/api/parent/notifications?page=1&pageSize=20')
      .set(authHeader(token));
    const id = list.body.items[0].id as string;

    const res = await api()
      .delete(`/api/parent/notifications/${id}`)
      .set(authHeader(token));
    expect(res.status).toBe(200);

    const reste = await prisma.notification.count({ where: { utilisateurId: userId } });
    expect(reste).toBe(1);
  });

  it("refuse de lire la notification d'un autre parent (403)", async () => {
    const a = await createVerifiedParent();
    await seedNotifs(a.userId, 1);
    const list = await api()
      .get('/api/parent/notifications?page=1&pageSize=20')
      .set(authHeader(a.token));
    const id = list.body.items[0].id as string;

    const b = await createVerifiedParent();
    const res = await api()
      .put(`/api/parent/notifications/${id}/read`)
      .set(authHeader(b.token));
    expect(res.status).toBe(403);
  });

  it("refuse de supprimer la notification d'un autre parent (403)", async () => {
    const a = await createVerifiedParent();
    await seedNotifs(a.userId, 1);
    const list = await api()
      .get('/api/parent/notifications?page=1&pageSize=20')
      .set(authHeader(a.token));
    const id = list.body.items[0].id as string;

    const b = await createVerifiedParent();
    const res = await api()
      .delete(`/api/parent/notifications/${id}`)
      .set(authHeader(b.token));
    expect(res.status).toBe(403);
  });

  it("renvoie 404 pour une notification inexistante", async () => {
    const { token } = await createVerifiedParent();
    const res = await api()
      .delete('/api/parent/notifications/00000000-0000-0000-0000-000000000000')
      .set(authHeader(token));
    expect(res.status).toBe(404);
  });
});
