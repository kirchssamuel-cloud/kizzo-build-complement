import { describe, expect, it } from 'vitest';
import { api, authHeader, createVerifiedParent } from './helpers';

function childPayload(overrides: Record<string, unknown> = {}) {
  return {
    prenom: 'Lina',
    dateNaissance: '2015-09-01',
    niveauScolaire: 'cm1',
    avatarId: 3,
    couleurTheme: '#4C6971',
    ...overrides,
  };
}

describe('CRUD /api/parent/children', () => {
  it('refuse l\'accès sans token (401)', async () => {
    const res = await api().get('/api/parent/children');
    expect(res.status).toBe(401);
  });

  it('liste vide pour un nouveau parent (200)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api().get('/api/parent/children').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.enfants).toEqual([]);
  });

  it('crée un profil enfant (201) puis le retrouve dans la liste', async () => {
    const { token } = await createVerifiedParent();

    const createRes = await api()
      .post('/api/parent/children')
      .set(authHeader(token))
      .send(childPayload());
    expect(createRes.status).toBe(201);
    expect(createRes.body.enfant).toMatchObject({ prenom: 'Lina', niveauScolaire: 'cm1' });
    const childId = createRes.body.enfant.id;
    expect(childId).toBeTypeOf('string');

    const listRes = await api().get('/api/parent/children').set(authHeader(token));
    expect(listRes.status).toBe(200);
    expect(listRes.body.enfants).toHaveLength(1);
    expect(listRes.body.enfants[0].id).toBe(childId);
  });

  it('refuse une couleur de thème invalide (400)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api()
      .post('/api/parent/children')
      .set(authHeader(token))
      .send(childPayload({ couleurTheme: 'rouge' }));
    expect(res.status).toBe(400);
  });

  it('met à jour un profil enfant (PATCH)', async () => {
    const { token } = await createVerifiedParent();
    const created = await api()
      .post('/api/parent/children')
      .set(authHeader(token))
      .send(childPayload());
    const childId = created.body.enfant.id;

    const patchRes = await api()
      .patch(`/api/parent/children/${childId}`)
      .set(authHeader(token))
      .send({ prenom: 'Lina-Marie' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.enfant.prenom).toBe('Lina-Marie');
  });

  it('supprime un profil enfant (DELETE)', async () => {
    const { token } = await createVerifiedParent();
    const created = await api()
      .post('/api/parent/children')
      .set(authHeader(token))
      .send(childPayload());
    const childId = created.body.enfant.id;

    const delRes = await api()
      .delete(`/api/parent/children/${childId}`)
      .set(authHeader(token));
    expect(delRes.status).toBe(200);

    const listRes = await api().get('/api/parent/children').set(authHeader(token));
    expect(listRes.body.enfants).toHaveLength(0);
  });

  it('isole les données entre parents (un parent ne voit pas l\'enfant d\'un autre)', async () => {
    const parentA = await createVerifiedParent();
    const parentB = await createVerifiedParent();

    const created = await api()
      .post('/api/parent/children')
      .set(authHeader(parentA.token))
      .send(childPayload());
    const childId = created.body.enfant.id;

    // Parent B ne doit pas pouvoir lire l'enfant de Parent A.
    const res = await api()
      .get(`/api/parent/children/${childId}`)
      .set(authHeader(parentB.token));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
