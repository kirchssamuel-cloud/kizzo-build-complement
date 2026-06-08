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

describe('Export RGPD GET /api/parent/account/export', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().get('/api/parent/account/export');
    expect(res.status).toBe(401);
  });

  it('exporte le profil parent + les enfants (portabilité art. 20)', async () => {
    const { token, email } = await createVerifiedParent();
    await createChild(token, { prenom: 'Lina' });
    await createChild(token, { prenom: 'Tom', dateNaissance: '2017-03-10' });

    const res = await api().get('/api/parent/account/export').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.format).toBe('kizzo-export-v1');
    expect(res.body.genereLe).toBeTruthy();
    expect(res.body.parent.email).toBe(email.toLowerCase());
    expect(res.body.enfants).toHaveLength(2);
    const prenoms = res.body.enfants.map((e: { prenom: string }) => e.prenom).sort();
    expect(prenoms).toEqual(['Lina', 'Tom']);
    // En-tête de téléchargement.
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  it('n\'expose ni le PIN enfant ni le mot de passe parent', async () => {
    const { token } = await createVerifiedParent();
    await createChild(token);
    const res = await api().get('/api/parent/account/export').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.parent.motDePasse).toBeUndefined();
    for (const enfant of res.body.enfants) {
      expect(enfant.pinEnfant).toBeUndefined();
    }
  });

  it('n\'exporte que les données du parent connecté (isolation)', async () => {
    const parentA = await createVerifiedParent();
    await createChild(parentA.token, { prenom: 'EnfantA' });

    const parentB = await createVerifiedParent();
    const res = await api().get('/api/parent/account/export').set(authHeader(parentB.token));
    expect(res.status).toBe(200);
    expect(res.body.enfants).toHaveLength(0);
    expect(res.body.parent.email).toBe(parentB.email.toLowerCase());
  });
});
