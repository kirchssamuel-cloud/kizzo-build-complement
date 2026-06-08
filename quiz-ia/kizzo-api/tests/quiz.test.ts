import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, authHeader, createVerifiedParent } from './helpers';
import prisma from '../src/config/prisma';

// On mocke le client du Cerveau IA (LMS) : aucun appel réseau réel pendant les tests.
// Les helpers de mapping (import direct depuis ./mappings) restent réels.
vi.mock('../src/lib/quiz-ai', () => ({
  quizAiClient: {
    generateFromTopic: vi.fn(),
    generateFromPhoto: vi.fn(),
    getQuiz: vi.fn(),
    getSubjects: vi.fn(),
    sendFeedback: vi.fn(),
  },
}));

import { quizAiClient } from '../src/lib/quiz-ai';

const mocked = vi.mocked(quizAiClient);

/** Réponse type du LMS : 2 questions (QCM4 + VF). */
function aiQuizResponse() {
  return {
    quiz_id: 'lms-quiz-123',
    mode: 'topic' as const,
    metadata: { matiere: 'mathematiques', niveau: 'CM1', chapitre: 'Additions' },
    questions: [
      {
        type: 'QCM4' as const,
        question: '2 + 2 ?',
        options: [
          { label: '3', value: '3' },
          { label: '4', value: '4' },
        ],
        correct_answer: '4',
        explanation: 'Deux plus deux font quatre.',
      },
      {
        type: 'VF' as const,
        question: 'Le ciel est bleu.',
        options: [
          { label: 'vrai', value: 'vrai' },
          { label: 'faux', value: 'faux' },
        ],
        correct_answer: 'vrai',
      },
    ],
    is_fallback: false,
    generated_at: new Date().toISOString(),
    generation_ms: 120,
  };
}

async function seedChild() {
  const parent = await createVerifiedParent();
  const enfant = await prisma.profilEnfant.create({
    data: {
      parentId: parent.userId,
      prenom: 'Noé',
      dateNaissance: new Date('2015-09-01'),
      niveauScolaire: 'cm1',
    },
  });
  return { parent, enfant };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocked.generateFromTopic.mockResolvedValue(aiQuizResponse());
  mocked.generateFromPhoto.mockResolvedValue(aiQuizResponse());
  mocked.sendFeedback.mockResolvedValue({ status: 'ok', quiz_id: 'lms-quiz-123' });
});

describe('Quiz BFF /api/quiz', () => {
  it('refuse la génération sans token (401)', async () => {
    const res = await api().post('/api/quiz/generate/topic').send({});
    expect(res.status).toBe(401);
  });

  it('génère un quiz depuis un thème, le persiste et masque les réponses', async () => {
    const { parent, enfant } = await seedChild();
    const res = await api()
      .post('/api/quiz/generate/topic')
      .set(authHeader(parent.token))
      .send({ profilEnfantId: enfant.id, matiere: 'maths', niveau: 'cm1', chapitre: 'Additions' });

    expect(res.status).toBe(201);
    expect(mocked.generateFromTopic).toHaveBeenCalledOnce();
    // Le LMS doit recevoir les libellés IA, pas les enums backend.
    expect(mocked.generateFromTopic).toHaveBeenCalledWith(
      expect.objectContaining({ matiere: 'mathematiques', niveau: 'CM1', child_profile_id: enfant.id }),
    );
    // La vue client ne contient ni la réponse attendue ni l'explication.
    const q0 = res.body.quiz.questions[0];
    expect(q0).not.toHaveProperty('reponse');
    expect(q0).not.toHaveProperty('explication');
    expect(res.body.quiz.questions).toHaveLength(2);

    // Le défi persisté garde le lien LMS pour le feedback.
    const defi = await prisma.defi.findUnique({ where: { id: res.body.quiz.id } });
    expect(defi?.sourceIa).toBe(true);
    expect(defi?.quizIaId).toBe('lms-quiz-123');
    expect(defi?.matiere).toBe('maths');
  });

  it('refuse un niveau hors couverture LMS (terminale → 400)', async () => {
    const { parent, enfant } = await seedChild();
    const res = await api()
      .post('/api/quiz/generate/topic')
      .set(authHeader(parent.token))
      .send({ profilEnfantId: enfant.id, matiere: 'maths', niveau: 'terminale' });
    expect(res.status).toBe(400);
    expect(mocked.generateFromTopic).not.toHaveBeenCalled();
  });

  it('corrige les réponses, crédite 30 min et relaie le feedback au LMS', async () => {
    const { parent, enfant } = await seedChild();
    const gen = await api()
      .post('/api/quiz/generate/topic')
      .set(authHeader(parent.token))
      .send({ profilEnfantId: enfant.id, matiere: 'maths', niveau: 'cm1' });
    const quizId = gen.body.quiz.id;
    const [q0, q1] = gen.body.quiz.questions;

    const res = await api()
      .post(`/api/quiz/${quizId}/submit`)
      .set(authHeader(parent.token))
      .send({
        profilEnfantId: enfant.id,
        dureeSeconds: 30,
        reponses: [
          { questionId: q0.id, reponse: '4' },
          { questionId: q1.id, reponse: 'vrai' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(100);
    expect(res.body.reussi).toBe(true);
    expect(res.body.tempsCredite).toBe(30);
    // Récap par question (E16/E17) sans révéler la bonne réponse.
    expect(res.body.resultats).toHaveLength(2);
    expect(res.body.resultats.every((r: { estCorrecte: boolean }) => r.estCorrecte)).toBe(true);
    expect(res.body.resultats[0]).not.toHaveProperty('reponse');
    expect(res.body.resultats[0]).toHaveProperty('ordre');
    expect(mocked.sendFeedback).toHaveBeenCalledWith(
      'lms-quiz-123',
      expect.objectContaining({ child_profile_id: enfant.id, score: 100, time_spent_ms: 30000 }),
    );
  });

  it('un feedback LMS en échec ne bloque pas le résultat de l\'enfant', async () => {
    mocked.sendFeedback.mockRejectedValueOnce(new Error('LMS down'));
    const { parent, enfant } = await seedChild();
    const gen = await api()
      .post('/api/quiz/generate/topic')
      .set(authHeader(parent.token))
      .send({ profilEnfantId: enfant.id, matiere: 'maths', niveau: 'cm1' });
    const quizId = gen.body.quiz.id;
    const [q0, q1] = gen.body.quiz.questions;

    const res = await api()
      .post(`/api/quiz/${quizId}/submit`)
      .set(authHeader(parent.token))
      .send({
        profilEnfantId: enfant.id,
        reponses: [
          { questionId: q0.id, reponse: '4' },
          { questionId: q1.id, reponse: 'faux' },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.score).toBe(50); // 1/2 correct
    expect(res.body.reussi).toBe(false);
    // Une question juste, une fausse — sans jamais exposer la bonne réponse.
    const corrects = res.body.resultats.filter((r: { estCorrecte: boolean }) => r.estCorrecte);
    expect(corrects).toHaveLength(1);
  });

  it('renvoie l\'historique des quiz de l\'enfant', async () => {
    const { parent, enfant } = await seedChild();
    const gen = await api()
      .post('/api/quiz/generate/topic')
      .set(authHeader(parent.token))
      .send({ profilEnfantId: enfant.id, matiere: 'maths', niveau: 'cm1' });
    const quizId = gen.body.quiz.id;
    const [q0, q1] = gen.body.quiz.questions;
    await api()
      .post(`/api/quiz/${quizId}/submit`)
      .set(authHeader(parent.token))
      .send({
        profilEnfantId: enfant.id,
        reponses: [
          { questionId: q0.id, reponse: '4' },
          { questionId: q1.id, reponse: 'vrai' },
        ],
      });

    const res = await api()
      .get(`/api/quiz/history/${enfant.id}`)
      .set(authHeader(parent.token));
    expect(res.status).toBe(200);
    expect(res.body.tentatives).toHaveLength(1);
    expect(res.body.tentatives[0]).toMatchObject({ score: 100, reussi: true, matiere: 'maths' });
  });

  it('renvoie 404 pour un quiz inexistant', async () => {
    const { parent } = await seedChild();
    const res = await api()
      .get('/api/quiz/00000000-0000-0000-0000-000000000000')
      .set(authHeader(parent.token));
    expect(res.status).toBe(404);
  });
});
