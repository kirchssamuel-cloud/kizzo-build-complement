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

describe('Filtrage web /api/parent/web-filter', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().get('/api/parent/web-filter/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });

  it('retourne des valeurs par défaut quand aucun filtre n\'existe', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const res = await api().get(`/api/parent/web-filter/${childId}`).set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.filtre.niveau).toBe('modere');
    expect(res.body.filtre.safeSearch).toBe(true);
  });

  it('met à jour le filtre et le relit', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const put = await api()
      .put(`/api/parent/web-filter/${childId}`)
      .set(authHeader(token))
      .send({ niveau: 'personnalise', blacklistUrls: ['casino.com'], safeSearch: true });
    expect(put.status).toBe(200);
    expect(put.body.filtre.niveau).toBe('personnalise');
    expect(put.body.filtre.blacklistUrls).toContain('casino.com');

    const get = await api().get(`/api/parent/web-filter/${childId}`).set(authHeader(token));
    expect(get.body.filtre.blacklistUrls).toContain('casino.com');
  });

  it('force safeSearch=true pour un enfant de moins de 12 ans', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token, { dateNaissance: '2018-01-01', niveauScolaire: 'cp' });
    const put = await api()
      .put(`/api/parent/web-filter/${childId}`)
      .set(authHeader(token))
      .send({ niveau: 'modere', safeSearch: false });
    expect(put.status).toBe(200);
    expect(put.body.filtre.safeSearch).toBe(true);
  });

  it('isole les données entre parents (403/404)', async () => {
    const parentA = await createVerifiedParent();
    const parentB = await createVerifiedParent();
    const childId = await createChild(parentA.token);
    const res = await api()
      .get(`/api/parent/web-filter/${childId}`)
      .set(authHeader(parentB.token));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

describe('Gestion des apps /api/parent/apps', () => {
  it('liste vide au départ', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const res = await api().get(`/api/parent/apps/${childId}`).set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.apps).toEqual([]);
  });

  it('upsert une règle d\'app puis la met à jour', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const create = await api()
      .put(`/api/parent/apps/${childId}`)
      .set(authHeader(token))
      .send({ bundleId: 'com.tiktok', nomApp: 'TikTok', categorie: 'reseaux_sociaux', autorisee: false });
    expect(create.status).toBe(200);
    expect(create.body.app.autorisee).toBe(false);

    const update = await api()
      .put(`/api/parent/apps/${childId}`)
      .set(authHeader(token))
      .send({ bundleId: 'com.tiktok', nomApp: 'TikTok', autorisee: true, limiteQuotidienne: 30 });
    expect(update.status).toBe(200);
    expect(update.body.app.autorisee).toBe(true);
    expect(update.body.app.limiteQuotidienne).toBe(30);

    const list = await api().get(`/api/parent/apps/${childId}`).set(authHeader(token));
    expect(list.body.apps).toHaveLength(1);
  });

  it('supprime une règle d\'app', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    await api()
      .put(`/api/parent/apps/${childId}`)
      .set(authHeader(token))
      .send({ bundleId: 'com.youtube', nomApp: 'YouTube' });
    const del = await api()
      .delete(`/api/parent/apps/${childId}/com.youtube`)
      .set(authHeader(token));
    expect(del.status).toBe(200);
    const list = await api().get(`/api/parent/apps/${childId}`).set(authHeader(token));
    expect(list.body.apps).toHaveLength(0);
  });

  it('404 sur suppression d\'une règle inexistante', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const del = await api()
      .delete(`/api/parent/apps/${childId}/com.inexistant`)
      .set(authHeader(token));
    expect(del.status).toBe(404);
  });
});

describe('Profil parent /api/parent/profile', () => {
  it('lit le profil du parent connecté', async () => {
    const { token, email } = await createVerifiedParent();
    const res = await api().get('/api/parent/profile').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.profil.email).toBe(email.toLowerCase());
  });

  it('met à jour prénom et langue', async () => {
    const { token } = await createVerifiedParent();
    const res = await api()
      .put('/api/parent/profile')
      .set(authHeader(token))
      .send({ prenom: 'Samuel', langue: 'en' });
    expect(res.status).toBe(200);
    expect(res.body.profil.prenom).toBe('Samuel');
    expect(res.body.profil.langue).toBe('en');
  });

  it('refuse une mise à jour vide (400)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api().put('/api/parent/profile').set(authHeader(token)).send({});
    expect(res.status).toBe(400);
  });
});

describe('Suppression de compte RGPD /api/parent/account', () => {
  it('refuse sans la confirmation exacte (400)', async () => {
    const { token, password } = await createVerifiedParent();
    const res = await api()
      .delete('/api/parent/account')
      .set(authHeader(token))
      .send({ password, confirmation: 'oui' });
    expect(res.status).toBe(400);
  });

  it('refuse avec un mauvais mot de passe (401)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api()
      .delete('/api/parent/account')
      .set(authHeader(token))
      .send({ password: 'WrongPass1!', confirmation: 'SUPPRIMER' });
    expect(res.status).toBe(401);
  });

  it('supprime le compte + ses enfants en cascade et empêche la reconnexion', async () => {
    const { token, email, password } = await createVerifiedParent();
    await createChild(token);
    const del = await api()
      .delete('/api/parent/account')
      .set(authHeader(token))
      .send({ password, confirmation: 'SUPPRIMER' });
    expect(del.status).toBe(200);

    const login = await api().post('/api/auth/login').send({ email, password });
    expect(login.status).toBeGreaterThanOrEqual(400);
  });
});

describe('Rapport d\'activité /api/parent/activity', () => {
  it('retourne une structure de rapport vide pour un nouvel enfant', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const res = await api()
      .get(`/api/parent/activity/${childId}/report?jours=7`)
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.periode.jours).toBe(7);
    expect(res.body.ecran.totalSeconds).toBe(0);
    expect(res.body.quiz.total).toBe(0);
  });

  it('refuse jours hors bornes (400)', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const res = await api()
      .get(`/api/parent/activity/${childId}/report?jours=999`)
      .set(authHeader(token));
    expect(res.status).toBe(400);
  });
});
