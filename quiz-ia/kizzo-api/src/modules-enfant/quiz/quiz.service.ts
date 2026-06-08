import { Prisma, StatutDefi, TypeQuestion, type QuestionDefi } from '@prisma/client';
import prisma from '../../config/prisma';
import { logger } from '../../config/logger';
import { HttpError } from '../../middleware/error.middleware';
import { DEFI_DEFAULT_THRESHOLD } from '../../config/consts';
import {
  aiMatiereToBackend,
  aiNiveauToBackend,
  normalizeAiQuestion,
} from '../../lib/quiz-ai/mappings';
import { quizAiClient } from '../../lib/quiz-ai';
import type { AiQuizResponse } from '../../lib/quiz-ai/types';

/** Minutes créditées par défaut quand l'enfant réussit un quiz IA (CDC : ~30 min). */
const DEFAULT_REWARD_MINUTES = 30;

/**
 * Persiste un quiz généré par le Cerveau IA (LMS) sous forme de `Defi` + `QuestionDefi`.
 * Le `quizIaId` est conservé pour relayer le feedback de complétion au LMS.
 */
async function persistAiQuiz(ai: AiQuizResponse, profilEnfantId: string) {
  const matiere = aiMatiereToBackend(ai.metadata.matiere);
  const niveau = aiNiveauToBackend(ai.metadata.niveau);

  const titre = ai.metadata.chapitre
    ? `${ai.metadata.chapitre}`
    : `Quiz ${ai.metadata.matiere}`;

  return prisma.defi.create({
    data: {
      titre,
      description: ai.metadata.chapitre ?? null,
      matiere,
      niveauxScolaires: niveau ? [niveau] : [],
      difficulte: ai.metadata.difficulte ?? 1,
      nombreQuestions: ai.questions.length,
      seuilReussite: DEFI_DEFAULT_THRESHOLD,
      tempsRecompense: DEFAULT_REWARD_MINUTES,
      statut: StatutDefi.publie,
      profilEnfantId,
      sourceIa: true,
      quizIaId: ai.quiz_id,
      questions: {
        create: ai.questions.map((q, i) => {
          const n = normalizeAiQuestion(q, i + 1);
          return {
            ordre: n.ordre,
            enonce: n.enonce,
            type: n.type,
            options: n.options ?? Prisma.JsonNull,
            reponse: n.reponse,
            explication: n.explication,
          };
        }),
      },
    },
    include: { questions: { orderBy: { ordre: 'asc' } } },
  });
}

/** Génère un quiz à partir d'un thème (matière/niveau/chapitre) et le persiste. */
export async function generateFromTopic(input: {
  profilEnfantId: string;
  matiereAi: string;
  niveauAi: string;
  chapitre?: string;
  difficulte?: number;
  nombreQuestions?: number;
}) {
  const ai = await quizAiClient.generateFromTopic({
    child_profile_id: input.profilEnfantId,
    matiere: input.matiereAi,
    niveau: input.niveauAi,
    chapitre: input.chapitre,
    difficulte: input.difficulte,
    nb_questions: input.nombreQuestions,
  });
  return persistAiQuiz(ai, input.profilEnfantId);
}

/** Génère un quiz à partir d'une photo de devoir (multipart) et le persiste. */
export async function generateFromPhoto(input: {
  profilEnfantId: string;
  image: Buffer;
  filename: string;
  mimeType: string;
}) {
  const ai = await quizAiClient.generateFromPhoto(
    input.image,
    input.filename,
    input.mimeType,
    input.profilEnfantId,
  );
  return persistAiQuiz(ai, input.profilEnfantId);
}

/** Récupère un quiz persisté (défi) avec ses questions, sans révéler les réponses. */
export async function getQuiz(quizId: string) {
  const defi = await prisma.defi.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { ordre: 'asc' } } },
  });
  if (!defi) throw new HttpError(404, 'Quiz introuvable.');
  return defi;
}

const norm = (s: string) => s.trim().toLowerCase();

/** Compare la réponse de l'enfant à la réponse attendue selon le type de question. */
function isCorrect(question: QuestionDefi, given: string): boolean {
  if (question.type === TypeQuestion.tri || question.type === TypeQuestion.association) {
    // SORT/MATCH : la réponse attendue est un tableau JSON sérialisé.
    try {
      return JSON.stringify(JSON.parse(given)) === JSON.stringify(JSON.parse(question.reponse));
    } catch {
      return norm(given) === norm(question.reponse);
    }
  }
  return norm(given) === norm(question.reponse);
}

/**
 * Corrige les réponses, enregistre la tentative, crédite le temps si réussite,
 * puis relaie le feedback au LMS (non bloquant en cas d'échec réseau).
 */
export async function submitQuiz(input: {
  quizId: string;
  profilEnfantId: string;
  reponses: Array<{ questionId: string; reponse: string }>;
  dureeSeconds?: number;
}) {
  const defi = await prisma.defi.findUnique({
    where: { id: input.quizId },
    include: { questions: true },
  });
  if (!defi) throw new HttpError(404, 'Quiz introuvable.');

  let correct = 0;
  // Récap par question (CDC E16/E17) : on n'expose JAMAIS la bonne réponse,
  // seulement si la réponse de l'enfant était juste — le quiz est terminé.
  const resultats = defi.questions
    .slice()
    .sort((a, b) => a.ordre - b.ordre)
    .map((q) => {
      const r = input.reponses.find((x) => x.questionId === q.id);
      const estCorrecte = !!r && isCorrect(q, r.reponse);
      if (estCorrecte) correct++;
      return { questionId: q.id, ordre: q.ordre, estCorrecte };
    });
  const score = Math.round((correct / Math.max(defi.questions.length, 1)) * 100);
  const reussi = score >= defi.seuilReussite;
  const tempsCredite = reussi ? defi.tempsRecompense : 0;

  const tentative = await prisma.tentativeDefi.create({
    data: {
      defiId: defi.id,
      profilEnfantId: input.profilEnfantId,
      score,
      reussi,
      tempsCredite,
      dureeSeconds: input.dureeSeconds,
      reponses: input.reponses as unknown as Prisma.InputJsonValue,
    },
  });

  // Feedback LMS — anti-doublon + télémétrie côté Cerveau IA. Ne doit jamais
  // bloquer le résultat affiché à l'enfant.
  if (defi.sourceIa && defi.quizIaId) {
    try {
      await quizAiClient.sendFeedback(defi.quizIaId, {
        child_profile_id: input.profilEnfantId,
        score,
        time_spent_ms: (input.dureeSeconds ?? 0) * 1000,
      });
    } catch (err) {
      logger.warn({ err, quizIaId: defi.quizIaId }, 'Feedback LMS échoué (non bloquant)');
    }
  }

  return {
    tentative,
    score,
    reussi,
    tempsCredite,
    correct,
    total: defi.questions.length,
    resultats,
  };
}

/** Historique des quiz d'un enfant (E30 / GET /quiz/history/:childId). */
export async function getHistory(profilEnfantId: string) {
  const profil = await prisma.profilEnfant.findUnique({ where: { id: profilEnfantId } });
  if (!profil) throw new HttpError(404, 'Profil enfant introuvable.');

  const tentatives = await prisma.tentativeDefi.findMany({
    where: { profilEnfantId },
    orderBy: { dateTentative: 'desc' },
    take: 50,
    include: { defi: { select: { titre: true, matiere: true } } },
  });
  return tentatives.map((t) => ({
    id: t.id,
    date: t.dateTentative,
    titre: t.defi.titre,
    matiere: t.defi.matiere,
    score: t.score,
    reussi: t.reussi,
    tempsCredite: t.tempsCredite,
  }));
}
