import type { Request, Response } from 'express';
import type { Defi, QuestionDefi } from '@prisma/client';
import { asyncHandler } from '../../middleware/async-handler';
import { HttpError } from '../../middleware/error.middleware';
import { backendMatiereToAi, backendNiveauToAi } from '../../lib/quiz-ai/mappings';
import { generateTopicSchema, generatePhotoSchema, submitQuizSchema } from './quiz.schema';
import * as quizService from './quiz.service';

/** Image max 2 Mo, formats acceptés par le Cerveau IA. */
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

type DefiWithQuestions = Defi & { questions: QuestionDefi[] };

/**
 * Vue d'un quiz exposée à l'app enfant : les réponses attendues et explications
 * ne sont JAMAIS envoyées au client (correction côté serveur uniquement).
 */
function toClientQuiz(defi: DefiWithQuestions) {
  return {
    id: defi.id,
    titre: defi.titre,
    description: defi.description,
    matiere: defi.matiere,
    difficulte: defi.difficulte,
    nombreQuestions: defi.nombreQuestions,
    tempsRecompense: defi.tempsRecompense,
    sourceIa: defi.sourceIa,
    questions: defi.questions.map((q) => ({
      id: q.id,
      ordre: q.ordre,
      enonce: q.enonce,
      type: q.type,
      options: q.options ?? null,
      imageUrl: q.imageUrl,
    })),
  };
}

export const generateTopic = asyncHandler(async (req: Request, res: Response) => {
  const input = generateTopicSchema.parse(req.body);
  const defi = await quizService.generateFromTopic({
    profilEnfantId: input.profilEnfantId,
    matiereAi: backendMatiereToAi(input.matiere),
    niveauAi: backendNiveauToAi(input.niveau),
    chapitre: input.chapitre,
    difficulte: input.difficulte,
    nombreQuestions: input.nombreQuestions,
  });
  return res.status(201).json({ quiz: toClientQuiz(defi) });
});

export const generatePhoto = asyncHandler(async (req: Request, res: Response) => {
  const { profilEnfantId } = generatePhotoSchema.parse(req.body);
  const file = req.file;
  if (!file) throw new HttpError(400, 'Image manquante (champ « image »).');
  if (file.size > MAX_IMAGE_BYTES) {
    throw new HttpError(400, 'Image trop volumineuse (max 2 Mo).');
  }
  if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
    throw new HttpError(400, 'Format d\'image non supporté (JPEG, PNG ou WebP).');
  }
  const defi = await quizService.generateFromPhoto({
    profilEnfantId,
    image: file.buffer,
    filename: file.originalname || 'devoir.jpg',
    mimeType: file.mimetype,
  });
  return res.status(201).json({ quiz: toClientQuiz(defi) });
});

export const getQuiz = asyncHandler(async (req: Request<{ quizId: string }>, res: Response) => {
  const defi = await quizService.getQuiz(req.params.quizId);
  return res.json({ quiz: toClientQuiz(defi as DefiWithQuestions) });
});

export const submitQuiz = asyncHandler(async (req: Request<{ quizId: string }>, res: Response) => {
  const input = submitQuizSchema.parse(req.body);
  const result = await quizService.submitQuiz({
    quizId: req.params.quizId,
    profilEnfantId: input.profilEnfantId,
    reponses: input.reponses,
    dureeSeconds: input.dureeSeconds,
  });
  return res.json(result);
});

export const history = asyncHandler(async (req: Request<{ childId: string }>, res: Response) => {
  const tentatives = await quizService.getHistory(req.params.childId);
  return res.json({ tentatives });
});
