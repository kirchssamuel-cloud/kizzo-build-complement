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

const regleValide = {
  jourSemaine: 'lundi',
  minutesMatin: 30,
  minutesApresMidi: 60,
  minutesSoir: 30,
  modeNuitActif: true,
  modeNuitDebut: '21:00',
  modeNuitFin: '07:00',
};

describe('Horaires & quota /api/parent/screen-time (P14-P15)', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().get(
      '/api/parent/screen-time/00000000-0000-0000-0000-000000000000',
    );
    expect(res.status).toBe(401);
  });

  it('retourne une liste vide quand aucune règle n\'existe', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const res = await api()
      .get(`/api/parent/screen-time/${childId}`)
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.regles).toEqual([]);
  });

  it('upsert une règle puis la relit', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);

    const put = await api()
      .put(`/api/parent/screen-time/${childId}`)
      .set(authHeader(token))
      .send(regleValide);
    expect(put.status).toBe(200);
    expect(put.body.regle.jourSemaine).toBe('lundi');
    expect(put.body.regle.minutesApresMidi).toBe(60);

    const get = await api()
      .get(`/api/parent/screen-time/${childId}`)
      .set(authHeader(token));
    expect(get.body.regles).toHaveLength(1);
    expect(get.body.regles[0].modeNuitDebut).toBe('21:00');
  });

  it('upsert est idempotent par (enfant, jour) — pas de doublon', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);

    await api()
      .put(`/api/parent/screen-time/${childId}`)
      .set(authHeader(token))
      .send(regleValide);
    const second = await api()
      .put(`/api/parent/screen-time/${childId}`)
      .set(authHeader(token))
      .send({ ...regleValide, minutesMatin: 45 });
    expect(second.status).toBe(200);
    expect(second.body.regle.minutesMatin).toBe(45);

    const get = await api()
      .get(`/api/parent/screen-time/${childId}`)
      .set(authHeader(token));
    expect(get.body.regles).toHaveLength(1);
  });

  it('rejette une heure mal formée (400)', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const res = await api()
      .put(`/api/parent/screen-time/${childId}`)
      .set(authHeader(token))
      .send({ ...regleValide, modeNuitDebut: '25:00' });
    expect(res.status).toBe(400);
  });

  it('crédite du temps via add-time', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const res = await api()
      .post(`/api/parent/screen-time/${childId}/add-time`)
      .set(authHeader(token))
      .send({ minutes: 20, raison: 'Bonne journée' });
    expect(res.status).toBe(200);
    expect(res.body.ajout.minutes).toBe(20);
  });

  it('retourne l\'usage du jour (totalSeconds + apps)', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const res = await api()
      .get(`/api/parent/screen-time/${childId}/usage`)
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jour');
    expect(res.body.totalSeconds).toBe(0);
    expect(Array.isArray(res.body.apps)).toBe(true);
  });

  it('refuse l\'accès à l\'enfant d\'un autre parent (403)', async () => {
    const a = await createVerifiedParent();
    const childId = await createChild(a.token);

    const b = await createVerifiedParent();
    const res = await api()
      .get(`/api/parent/screen-time/${childId}`)
      .set(authHeader(b.token));
    expect(res.status).toBe(403);
  });

  it('isole aussi PUT / add-time / usage entre parents (403)', async () => {
    const a = await createVerifiedParent();
    const childId = await createChild(a.token);
    const b = await createVerifiedParent();

    const put = await api()
      .put(`/api/parent/screen-time/${childId}`)
      .set(authHeader(b.token))
      .send(regleValide);
    expect(put.status).toBe(403);

    const add = await api()
      .post(`/api/parent/screen-time/${childId}/add-time`)
      .set(authHeader(b.token))
      .send({ minutes: 10, raison: 'test' });
    expect(add.status).toBe(403);

    const usage = await api()
      .get(`/api/parent/screen-time/${childId}/usage`)
      .set(authHeader(b.token));
    expect(usage.status).toBe(403);
  });

  it('renvoie 404 pour un enfant inexistant (UUID valide)', async () => {
    const { token } = await createVerifiedParent();
    const fakeId = '11111111-1111-1111-1111-111111111111';
    const res = await api()
      .get(`/api/parent/screen-time/${fakeId}`)
      .set(authHeader(token));
    expect(res.status).toBe(404);
  });
});
