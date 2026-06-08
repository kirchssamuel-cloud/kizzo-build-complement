import { z } from 'zod';
import { Matiere, NiveauScolaire } from '@prisma/client';
import { DEFI_MIN_QUESTIONS, DEFI_MAX_QUESTIONS } from '../../config/consts';

/** POST /quiz/generate/topic — génération par matière / niveau / chapitre (Mode B). */
export const generateTopicSchema = z.object({
  profilEnfantId: z.string().uuid(),
  matiere: z.nativeEnum(Matiere),
  niveau: z.nativeEnum(NiveauScolaire),
  chapitre: z.string().min(1).max(120).optional(),
  difficulte: z.number().int().min(1).max(5).optional(),
  nombreQuestions: z.number().int().min(DEFI_MIN_QUESTIONS).max(DEFI_MAX_QUESTIONS).optional(),
});
export type GenerateTopicInput = z.infer<typeof generateTopicSchema>;

/** Corps multipart de POST /quiz/generate/photo (Mode A) — l'image vient de multer. */
export const generatePhotoSchema = z.object({
  profilEnfantId: z.string().uuid(),
});
export type GeneratePhotoInput = z.infer<typeof generatePhotoSchema>;

/** POST /quiz/:quizId/submit — soumission des réponses de l'enfant. */
export const submitQuizSchema = z.object({
  profilEnfantId: z.string().uuid(),
  reponses: z.array(
    z.object({
      questionId: z.string().uuid(),
      /** Chaîne pour QCM/VF/FILL/CALC ; JSON sérialisé pour SORT/MATCH. */
      reponse: z.string(),
    }),
  ),
  dureeSeconds: z.number().int().min(0).optional(),
});
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
