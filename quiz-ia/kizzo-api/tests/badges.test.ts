import { describe, expect, it } from 'vitest';
import { api, authHeader, createVerifiedParent } from './helpers';
import prisma from '../src/config/prisma';

async function createChild(token: string, overrides: Record<string, unknown> = {}) {
  const res = await api()
    .post('/api/parent/children')
    .set(authHeader(token))
    .send({
      prenom: 'Lina',
      dateNaissance: '2015-09-01',
      niveauScolaire: 'cm1',
      avatarId: 3,
      couleurTheme: '#4C6971',
      ...overrides,
    });
  if (res.status !== 201) {
    throw new Error(`Création enfant échouée: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.enfant.id as string;
}

async function pairChildDevice(parentToken: string, childId: string) {
  const code = await api()
    .post('/api/parent/devices/pair-code')
    .set(authHeader(parentToken))
    .send({ profilEnfantId: childId });
  const pair = await api().post('/api/auth/pair-child').send({
    codeAppairage: code.body.code,
    nomAppareil: 'Tablette de Lina',
    plateforme: 'android',
    versionApp: '1.0.0',
  });
  return {
    childToken: pair.body.token as string,
    appareilId: pair.body.appareilId as string,
  };
}

const deviceHeader = (token: string, appareilId: string) => ({
  ...authHeader(token),
  'X-Kizzo-Appareil-Id': appareilId,
});

describe('Badges enfant GET /api/enfant/badges', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().get('/api/enfant/badges');
    expect(res.status).toBe(401);
  });

  it('refuse sans header X-Kizzo-Appareil-Id (400)', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const { childToken } = await pairChildDevice(token, childId);
    const res = await api().get('/api/enfant/badges').set(authHeader(childToken));
    expect(res.status).toBe(400);
  });

  it('retourne le catalogue complet, tout non acquis par défaut', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const { childToken, appareilId } = await pairChildDevice(token, childId);

    const res = await api()
      .get('/api/enfant/badges')
      .set(deviceHeader(childToken, appareilId));

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(9);
    expect(res.body.nombreAcquis).toBe(0);
    expect(res.body.badges).toHaveLength(9);
    expect(res.body.badges.every((b: { acquis: boolean }) => b.acquis === false)).toBe(true);
    // Aucune fuite : pas d'id interne de ligne Badge.
    expect(res.body.badges[0]).not.toHaveProperty('id');
    expect(res.body.badges[0]).toHaveProperty('titre');
    expect(res.body.badges[0]).toHaveProperty('description');
  });

  it('marque un badge comme acquis avec sa date', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const { childToken, appareilId } = await pairChildDevice(token, childId);

    await prisma.badge.create({
      data: { profilEnfantId: childId, typeBadge: 'precis' },
    });

    const res = await api()
      .get('/api/enfant/badges')
      .set(deviceHeader(childToken, appareilId));

    expect(res.status).toBe(200);
    expect(res.body.nombreAcquis).toBe(1);
    const precis = res.body.badges.find((b: { type: string }) => b.type === 'precis');
    expect(precis.acquis).toBe(true);
    expect(precis.dateObtention).not.toBeNull();
  });

  it('compte chaque type une seule fois même si obtenu plusieurs fois', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const { childToken, appareilId } = await pairChildDevice(token, childId);

    await prisma.badge.create({ data: { profilEnfantId: childId, typeBadge: 'lecteur' } });
    await prisma.badge.create({ data: { profilEnfantId: childId, typeBadge: 'lecteur' } });

    const res = await api()
      .get('/api/enfant/badges')
      .set(deviceHeader(childToken, appareilId));

    expect(res.status).toBe(200);
    expect(res.body.nombreAcquis).toBe(1);
  });

  it("refuse l'accès si l'appareil n'appartient pas au parent (403)", async () => {
    const a = await createVerifiedParent();
    const childId = await createChild(a.token);
    const { appareilId } = await pairChildDevice(a.token, childId);

    const b = await createVerifiedParent();
    const res = await api()
      .get('/api/enfant/badges')
      .set(deviceHeader(b.token, appareilId));

    expect(res.status).toBe(403);
  });
});
