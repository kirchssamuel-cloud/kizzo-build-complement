import { describe, expect, it } from 'vitest';
import { api, authHeader, createVerifiedParent } from './helpers';

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

/**
 * Appaire un appareil enfant : génère un code côté parent puis l'échange
 * via /auth/pair-child. Retourne le token enfant + l'id appareil.
 */
async function pairChildDevice(parentToken: string, childId: string) {
  const code = await api()
    .post('/api/parent/devices/pair-code')
    .set(authHeader(parentToken))
    .send({ profilEnfantId: childId });
  if (code.status !== 201 && code.status !== 200) {
    throw new Error(`pair-code échoué: ${code.status} ${JSON.stringify(code.body)}`);
  }
  const pair = await api().post('/api/auth/pair-child').send({
    codeAppairage: code.body.code,
    nomAppareil: 'Tablette de Lina',
    plateforme: 'android',
    versionApp: '1.0.0',
  });
  if (pair.status !== 200 && pair.status !== 201) {
    throw new Error(`pair-child échoué: ${pair.status} ${JSON.stringify(pair.body)}`);
  }
  return {
    childToken: pair.body.token as string,
    appareilId: pair.body.appareilId as string,
  };
}

const deviceHeader = (token: string, appareilId: string) => ({
  ...authHeader(token),
  'X-Kizzo-Appareil-Id': appareilId,
});

describe('Heartbeat appareil PUT /api/device-state', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().put('/api/device-state').send({});
    expect(res.status).toBe(401);
  });

  it('refuse sans header X-Kizzo-Appareil-Id (400)', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const { childToken } = await pairChildDevice(token, childId);
    const res = await api()
      .put('/api/device-state')
      .set(authHeader(childToken))
      .send({ vpnActif: true });
    expect(res.status).toBe(400);
  });

  it('met à jour l\'état + derniereSync et renvoie l\'appareil', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const { childToken, appareilId } = await pairChildDevice(token, childId);

    const res = await api()
      .put('/api/device-state')
      .set(deviceHeader(childToken, appareilId))
      .send({
        versionApp: '1.2.3',
        versionOs: 'Android 14',
        vpnActif: true,
        modeSupervise: true,
        permissionStore: false,
      });
    expect(res.status).toBe(200);
    expect(res.body.appareil.versionApp).toBe('1.2.3');
    expect(res.body.appareil.vpnActif).toBe(true);
    expect(res.body.appareil.modeSupervise).toBe(true);
    expect(res.body.appareil.derniereSync).toBeTruthy();
    // Le token push ne doit jamais être renvoyé.
    expect(res.body.appareil.tokenPush).toBeUndefined();
  });

  it('accepte un heartbeat vide (juste derniereSync)', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const { childToken, appareilId } = await pairChildDevice(token, childId);

    const res = await api()
      .put('/api/device-state')
      .set(deviceHeader(childToken, appareilId))
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.appareil.actif).toBe(true);
    expect(res.body.appareil.derniereSync).toBeTruthy();
  });

  it('renvoie 404 pour un appareil inconnu', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const { childToken } = await pairChildDevice(token, childId);
    const res = await api()
      .put('/api/device-state')
      .set(deviceHeader(childToken, '00000000-0000-0000-0000-000000000000'))
      .send({ vpnActif: true });
    expect(res.status).toBe(404);
  });

  it('isole les appareils entre parents (403)', async () => {
    const parentA = await createVerifiedParent();
    const childA = await createChild(parentA.token);
    const { appareilId } = await pairChildDevice(parentA.token, childA);

    const parentB = await createVerifiedParent();
    const childB = await createChild(parentB.token);
    const { childToken: childTokenB } = await pairChildDevice(parentB.token, childB);

    // Le token enfant de B (= parent B) tente de pousser sur l'appareil de A.
    const res = await api()
      .put('/api/device-state')
      .set(deviceHeader(childTokenB, appareilId))
      .send({ vpnActif: true });
    expect(res.status).toBe(403);
  });
});

describe('Lecture parent GET /api/parent/device-state/:childId', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().get(
      '/api/parent/device-state/00000000-0000-0000-0000-000000000000',
    );
    expect(res.status).toBe(401);
  });

  it('liste les appareils avec leur état à jour', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const { childToken, appareilId } = await pairChildDevice(token, childId);
    await api()
      .put('/api/device-state')
      .set(deviceHeader(childToken, appareilId))
      .send({ vpnActif: true, versionApp: '2.0.0' });

    const res = await api()
      .get(`/api/parent/device-state/${childId}`)
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.appareils)).toBe(true);
    expect(res.body.appareils).toHaveLength(1);
    expect(res.body.appareils[0].vpnActif).toBe(true);
    expect(res.body.appareils[0].versionApp).toBe('2.0.0');
    expect(res.body.appareils[0].tokenPush).toBeUndefined();
  });

  it('isole les données entre parents (403/404)', async () => {
    const parentA = await createVerifiedParent();
    const parentB = await createVerifiedParent();
    const childId = await createChild(parentA.token);
    const res = await api()
      .get(`/api/parent/device-state/${childId}`)
      .set(authHeader(parentB.token));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('refuse un childId non-uuid (400)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api()
      .get('/api/parent/device-state/pas-un-uuid')
      .set(authHeader(token));
    expect(res.status).toBe(400);
  });
});
