import { describe, expect, it } from 'vitest';
import { Plateforme } from '@prisma/client';
import { api, authHeader, createVerifiedParent, createAdmin } from './helpers';
import prisma from '../src/config/prisma';

async function createChild(token: string) {
  const res = await api()
    .post('/api/parent/children')
    .set(authHeader(token))
    .send({
      prenom: 'Lina',
      dateNaissance: '2015-09-01',
      niveauScolaire: 'cm1',
      avatarId: 3,
      couleurTheme: '#4C6971',
    });
  if (res.status !== 201) {
    throw new Error(`Création enfant échouée: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.enfant.id as string;
}

async function seedDevice(profilEnfantId: string, data: Record<string, unknown> = {}) {
  return prisma.appareil.create({
    data: {
      profilEnfantId,
      nomAffichage: 'Tablette de Lina',
      plateforme: Plateforme.android,
      tokenPush: 'fcm-secret-token',
      actif: true,
      derniereSync: new Date(),
      ...data,
    },
  });
}

const HEURE = 60 * 60 * 1000;

describe('Admin security-events GET /api/admin/security-events', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().get('/api/admin/security-events');
    expect(res.status).toBe(401);
  });

  it('refuse un parent non-admin (403)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api().get('/api/admin/security-events').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  it('retourne une page paginée pour un admin', async () => {
    const { token } = await createAdmin();
    const res = await api().get('/api/admin/security-events').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('totalPages');
  });

  it('expose les comptes verrouillés comme événement compte_verrouille', async () => {
    const { token } = await createAdmin();
    const parent = await createVerifiedParent();
    await prisma.utilisateur.update({
      where: { id: parent.userId },
      data: { dateVerrouillage: new Date(), tentativesEchouees: 5 },
    });
    const res = await api()
      .get('/api/admin/security-events')
      .query({ type: 'compte_verrouille', utilisateurId: parent.userId })
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].type).toBe('compte_verrouille');
    expect(res.body.items[0].utilisateurId).toBe(parent.userId);
  });

  it('rejette un type invalide (400)', async () => {
    const { token } = await createAdmin();
    const res = await api()
      .get('/api/admin/security-events')
      .query({ type: 'inexistant' })
      .set(authHeader(token));
    expect(res.status).toBe(400);
  });
});

describe('Admin devices GET /api/admin/devices', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().get('/api/admin/devices');
    expect(res.status).toBe(401);
  });

  it('refuse un parent non-admin (403)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api().get('/api/admin/devices').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  it("n'expose jamais le tokenPush (liste)", async () => {
    const admin = await createAdmin();
    const parent = await createVerifiedParent();
    const childId = await createChild(parent.token);
    await seedDevice(childId);
    const res = await api()
      .get('/api/admin/devices')
      .query({ parentId: parent.userId })
      .set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    for (const item of res.body.items) {
      expect(item).not.toHaveProperty('tokenPush');
      expect(item).toHaveProperty('tokenPushPresent');
    }
  });

  it('filtre par plateforme', async () => {
    const admin = await createAdmin();
    const parent = await createVerifiedParent();
    const childId = await createChild(parent.token);
    await seedDevice(childId, { plateforme: Plateforme.ios });
    const res = await api()
      .get('/api/admin/devices')
      .query({ parentId: parent.userId, plateforme: 'ios' })
      .set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.items.every((d: { plateforme: string }) => d.plateforme === 'ios')).toBe(true);
  });

  it("retourne le détail d'un appareil sans tokenPush", async () => {
    const admin = await createAdmin();
    const parent = await createVerifiedParent();
    const childId = await createChild(parent.token);
    const device = await seedDevice(childId);
    const res = await api()
      .get(`/api/admin/devices/${device.id}`)
      .set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.appareil).not.toHaveProperty('tokenPush');
    expect(res.body.appareil.tokenPushPresent).toBe(true);
  });

  it('404 sur un id inconnu', async () => {
    const admin = await createAdmin();
    const res = await api()
      .get('/api/admin/devices/00000000-0000-0000-0000-000000000000')
      .set(authHeader(admin.token));
    expect(res.status).toBe(404);
  });

  it('PATCH desappairer coupe l’accès et purge le token', async () => {
    const admin = await createAdmin();
    const parent = await createVerifiedParent();
    const childId = await createChild(parent.token);
    const device = await seedDevice(childId);
    const res = await api()
      .patch(`/api/admin/devices/${device.id}`)
      .set(authHeader(admin.token))
      .send({ action: 'desappairer' });
    expect(res.status).toBe(200);
    expect(res.body.appareil.actif).toBe(false);
    expect(res.body.appareil.tokenPushPresent).toBe(false);
    const inDb = await prisma.appareil.findUniqueOrThrow({ where: { id: device.id } });
    expect(inDb.tokenPush).toBeNull();
    expect(inDb.actif).toBe(false);
  });

  it('PATCH rejette une action invalide (400)', async () => {
    const admin = await createAdmin();
    const parent = await createVerifiedParent();
    const childId = await createChild(parent.token);
    const device = await seedDevice(childId);
    const res = await api()
      .patch(`/api/admin/devices/${device.id}`)
      .set(authHeader(admin.token))
      .send({ action: 'exploser' });
    expect(res.status).toBe(400);
  });
});

describe('Admin pairing-reset POST /api/admin/users/:id/reset-pairing', () => {
  it('refuse un parent non-admin (403)', async () => {
    const { token, userId } = await createVerifiedParent();
    const res = await api()
      .post(`/api/admin/users/${userId}/reset-pairing`)
      .set(authHeader(token));
    expect(res.status).toBe(403);
  });

  it('404 sur un utilisateur inconnu', async () => {
    const admin = await createAdmin();
    const res = await api()
      .post('/api/admin/users/00000000-0000-0000-0000-000000000000/reset-pairing')
      .set(authHeader(admin.token));
    expect(res.status).toBe(404);
  });

  it('désappaire tous les appareils du parent', async () => {
    const admin = await createAdmin();
    const parent = await createVerifiedParent();
    const childId = await createChild(parent.token);
    await seedDevice(childId);
    await seedDevice(childId, { nomAffichage: 'Deuxième' });
    const res = await api()
      .post(`/api/admin/users/${parent.userId}/reset-pairing`)
      .set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.reset).toBe(2);
    const restants = await prisma.appareil.count({
      where: { profilEnfantId: childId, actif: true },
    });
    expect(restants).toBe(0);
  });
});

describe('Admin anomalies GET /api/admin/anomalies', () => {
  it('refuse un parent non-admin (403)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api().get('/api/admin/anomalies').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  it('détecte un heartbeat absent (>24h)', async () => {
    const admin = await createAdmin();
    const parent = await createVerifiedParent();
    const childId = await createChild(parent.token);
    await seedDevice(childId, { derniereSync: new Date(Date.now() - 30 * HEURE) });
    const res = await api()
      .get('/api/admin/anomalies')
      .query({ type: 'heartbeat_absent' })
      .set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.items.some((a: { appareilId: string }) => a.appareilId != null)).toBe(true);
    expect(res.body.items.every((a: { type: string }) => a.type === 'heartbeat_absent')).toBe(true);
  });

  it('filtre par niveau critique (compte verrouillé)', async () => {
    const admin = await createAdmin();
    const parent = await createVerifiedParent();
    await prisma.utilisateur.update({
      where: { id: parent.userId },
      data: { dateVerrouillage: new Date(), tentativesEchouees: 5 },
    });
    const res = await api()
      .get('/api/admin/anomalies')
      .query({ niveau: 'critique' })
      .set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.items.every((a: { niveau: string }) => a.niveau === 'critique')).toBe(true);
    expect(res.body.items.some((a: { utilisateurId: string }) => a.utilisateurId === parent.userId)).toBe(true);
  });

  it('détecte un échec de paiement Stripe', async () => {
    const admin = await createAdmin();
    const parent = await createVerifiedParent();
    await prisma.utilisateur.update({
      where: { id: parent.userId },
      data: { statutAbonnement: 'past_due' },
    });
    const res = await api()
      .get('/api/admin/anomalies')
      .query({ type: 'echec_paiement' })
      .set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.items.some((a: { utilisateurId: string }) => a.utilisateurId === parent.userId)).toBe(true);
  });
});
