import { describe, expect, it } from 'vitest';
import { api, authHeader, createVerifiedParent } from './helpers';
import prisma from '../src/config/prisma';

/** Crée un parent vérifié + un enfant + un défi publié à 2 questions QCM. */
async function seedChallengeContext() {
  const parent = await createVerifiedParent();
  const enfant = await prisma.profilEnfant.create({
    data: {
      parentId: parent.userId,
      prenom: 'Lina',
      dateNaissance: new Date('2015-09-01'),
      niveauScolaire: 'cm1',
    },
  });
  const defi = await prisma.defi.create({
    data: {
      titre: 'Maths CM1 — additions',
      matiere: 'maths',
      difficulte: 2,
      nombreQuestions: 2,
      seuilReussite: 70,
      tempsRecompense: 15,
      statut: 'publie',
      questions: {
        create: [
          { ordre: 1, enonce: '2 + 2 ?', type: 'qcm', options: ['3', '4', '5'], reponse: '4' },
          { ordre: 2, enonce: '3 + 5 ?', type: 'qcm', options: ['7', '8', '9'], reponse: '8' },
        ],
      },
    },
    include: { questions: { orderBy: { ordre: 'asc' } } },
  });
  return { parent, enfant, defi };
}

describe('Défis enfant /api/enfant/challenges', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().get('/api/enfant/challenges');
    expect(res.status).toBe(401);
  });

  it('liste uniquement les défis publiés', async () => {
    const { parent } = await seedChallengeContext();
    // Un défi en brouillon ne doit pas apparaître.
    await prisma.defi.create({
      data: { titre: 'Brouillon', matiere: 'francais', statut: 'brouillon' },
    });

    const res = await api().get('/api/enfant/challenges').set(authHeader(parent.token));
    expect(res.status).toBe(200);
    expect(res.body.defis).toHaveLength(1);
    expect(res.body.defis[0].titre).toBe('Maths CM1 — additions');
  });

  it('récupère un défi avec ses questions (start)', async () => {
    const { parent, defi } = await seedChallengeContext();
    const res = await api()
      .get(`/api/enfant/challenges/${defi.id}`)
      .set(authHeader(parent.token));
    expect(res.status).toBe(200);
    expect(res.body.defi.questions).toHaveLength(2);
  });

  it('soumet de bonnes réponses → réussi, score 100, temps crédité', async () => {
    const { parent, enfant, defi } = await seedChallengeContext();
    const res = await api()
      .post(`/api/enfant/challenges/${defi.id}/submit`)
      .set(authHeader(parent.token))
      .send({
        profilEnfantId: enfant.id,
        dureeSeconds: 42,
        reponses: [
          { questionId: defi.questions[0].id, reponse: '4' },
          { questionId: defi.questions[1].id, reponse: '8' },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.score).toBe(100);
    expect(res.body.reussi).toBe(true);
    expect(res.body.tempsCredite).toBe(15);

    const tentatives = await prisma.tentativeDefi.findMany({ where: { defiId: defi.id } });
    expect(tentatives).toHaveLength(1);
  });

  it('soumet de mauvaises réponses → échoué, 0 minute créditée', async () => {
    const { parent, enfant, defi } = await seedChallengeContext();
    const res = await api()
      .post(`/api/enfant/challenges/${defi.id}/submit`)
      .set(authHeader(parent.token))
      .send({
        profilEnfantId: enfant.id,
        reponses: [
          { questionId: defi.questions[0].id, reponse: '3' },
          { questionId: defi.questions[1].id, reponse: '9' },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.score).toBe(0);
    expect(res.body.reussi).toBe(false);
    expect(res.body.tempsCredite).toBe(0);
  });

  it('renvoie 404 pour un défi inexistant', async () => {
    const { parent } = await seedChallengeContext();
    const res = await api()
      .get('/api/enfant/challenges/00000000-0000-0000-0000-000000000000')
      .set(authHeader(parent.token));
    expect(res.status).toBe(404);
  });
});
