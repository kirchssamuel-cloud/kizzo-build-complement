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

/** L'enfant crée une demande de temps via /api/enfant/requests (auth enfant/parent). */
async function createDemande(token: string, childId: string, minutes = 30) {
  const res = await api()
    .post('/api/enfant/requests')
    .set(authHeader(token))
    .send({ profilEnfantId: childId, minutes, message: 'Encore un peu stp' });
  if (res.status !== 201) {
    throw new Error(`Création demande échouée: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.demande.id as string;
}

describe('Demandes de temps — liste GET /api/parent/unlock-requests', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().get('/api/parent/unlock-requests');
    expect(res.status).toBe(401);
  });

  it('liste les demandes en attente de l\'enfant', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    await createDemande(token, childId, 30);

    const res = await api().get('/api/parent/unlock-requests').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.demandes).toHaveLength(1);
    expect(res.body.demandes[0].minutes).toBe(30);
    expect(res.body.demandes[0].statut).toBe('en_attente');
    expect(res.body.demandes[0].profilEnfant.prenom).toBe('Lina');
  });

  it('n\'expose pas les demandes des enfants d\'un autre parent', async () => {
    const parentA = await createVerifiedParent();
    const childA = await createChild(parentA.token);
    await createDemande(parentA.token, childA, 60);

    const parentB = await createVerifiedParent();
    const res = await api().get('/api/parent/unlock-requests').set(authHeader(parentB.token));
    expect(res.status).toBe(200);
    expect(res.body.demandes).toHaveLength(0);
  });

  it('ne fuite pas via ?childId d\'un enfant d\'un autre parent', async () => {
    const parentA = await createVerifiedParent();
    const childA = await createChild(parentA.token);
    await createDemande(parentA.token, childA, 30);

    const parentB = await createVerifiedParent();
    const res = await api()
      .get(`/api/parent/unlock-requests?childId=${childA}`)
      .set(authHeader(parentB.token));
    expect(res.status).toBe(200);
    expect(res.body.demandes).toHaveLength(0);
  });

  it('filtre par statut (?statut=acceptee)', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const demandeId = await createDemande(token, childId, 30);
    await api()
      .post(`/api/parent/unlock-requests/${demandeId}/respond`)
      .set(authHeader(token))
      .send({ accepter: true });

    const acceptees = await api()
      .get('/api/parent/unlock-requests?statut=acceptee')
      .set(authHeader(token));
    expect(acceptees.status).toBe(200);
    expect(acceptees.body.demandes).toHaveLength(1);

    const enAttente = await api().get('/api/parent/unlock-requests').set(authHeader(token));
    expect(enAttente.body.demandes).toHaveLength(0);
  });
});

describe('Demandes de temps — réponse POST /api/parent/unlock-requests/:id/respond', () => {
  it('accepte une demande, crédite le temps et passe en acceptee', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const demandeId = await createDemande(token, childId, 30);

    const res = await api()
      .post(`/api/parent/unlock-requests/${demandeId}/respond`)
      .set(authHeader(token))
      .send({ accepter: true });
    expect(res.status).toBe(200);
    expect(res.body.demande.statut).toBe('acceptee');
    expect(res.body.demande.dateReponse).toBeTruthy();

    // La demande n'apparaît plus dans la liste en attente.
    const pending = await api().get('/api/parent/unlock-requests').set(authHeader(token));
    expect(pending.body.demandes).toHaveLength(0);
  });

  it('crée bien un crédit AjoutTempsEcran à l\'acceptation', async () => {
    const { token, userId } = await createVerifiedParent();
    const childId = await createChild(token);
    const demandeId = await createDemande(token, childId, 30);

    await api()
      .post(`/api/parent/unlock-requests/${demandeId}/respond`)
      .set(authHeader(token))
      .send({ accepter: true, minutes: 60 });

    const credits = await prisma.ajoutTempsEcran.findMany({
      where: { profilEnfantId: childId },
    });
    expect(credits).toHaveLength(1);
    expect(credits[0].minutes).toBe(60);
    expect(credits[0].parentId).toBe(userId);
  });

  it('ne crée AUCUN crédit à un refus', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const demandeId = await createDemande(token, childId, 30);

    await api()
      .post(`/api/parent/unlock-requests/${demandeId}/respond`)
      .set(authHeader(token))
      .send({ accepter: false });

    const credits = await prisma.ajoutTempsEcran.findMany({
      where: { profilEnfantId: childId },
    });
    expect(credits).toHaveLength(0);
  });

  it('refuse une demande avec un message', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const demandeId = await createDemande(token, childId, 15);

    const res = await api()
      .post(`/api/parent/unlock-requests/${demandeId}/respond`)
      .set(authHeader(token))
      .send({ accepter: false, reponse: 'Pas avant les devoirs' });
    expect(res.status).toBe(200);
    expect(res.body.demande.statut).toBe('refusee');
    expect(res.body.demande.reponseParent).toBe('Pas avant les devoirs');
  });

  it('autorise un montant de minutes différent de la demande', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const demandeId = await createDemande(token, childId, 60);

    const res = await api()
      .post(`/api/parent/unlock-requests/${demandeId}/respond`)
      .set(authHeader(token))
      .send({ accepter: true, minutes: 15 });
    expect(res.status).toBe(200);
    expect(res.body.demande.statut).toBe('acceptee');
  });

  it('refuse de re-traiter une demande déjà répondue (409)', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const demandeId = await createDemande(token, childId, 30);
    await api()
      .post(`/api/parent/unlock-requests/${demandeId}/respond`)
      .set(authHeader(token))
      .send({ accepter: true });

    const again = await api()
      .post(`/api/parent/unlock-requests/${demandeId}/respond`)
      .set(authHeader(token))
      .send({ accepter: false });
    expect(again.status).toBe(409);
  });

  it('isole entre parents — un parent ne répond pas à la demande d\'un autre (403)', async () => {
    const parentA = await createVerifiedParent();
    const childA = await createChild(parentA.token);
    const demandeId = await createDemande(parentA.token, childA, 30);

    const parentB = await createVerifiedParent();
    const res = await api()
      .post(`/api/parent/unlock-requests/${demandeId}/respond`)
      .set(authHeader(parentB.token))
      .send({ accepter: true });
    expect(res.status).toBe(403);
  });

  it('renvoie 404 pour une demande inconnue', async () => {
    const { token } = await createVerifiedParent();
    const res = await api()
      .post('/api/parent/unlock-requests/00000000-0000-0000-0000-000000000000/respond')
      .set(authHeader(token))
      .send({ accepter: true });
    expect(res.status).toBe(404);
  });

  it('rejette un montant de minutes invalide (400)', async () => {
    const { token } = await createVerifiedParent();
    const childId = await createChild(token);
    const demandeId = await createDemande(token, childId, 30);
    const res = await api()
      .post(`/api/parent/unlock-requests/${demandeId}/respond`)
      .set(authHeader(token))
      .send({ accepter: true, minutes: 42 });
    expect(res.status).toBe(400);
  });
});
