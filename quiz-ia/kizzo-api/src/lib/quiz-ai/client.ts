/**
 * Client HTTP du Cerveau IA (Kizzo LMS).
 *
 * Sécurité : la clé API (`QUIZ_AI_API_KEY`) reste strictement côté serveur.
 * Les apps mobiles ne parlent jamais directement au service IA — elles passent
 * par le backend Kizzo qui agit en proxy et injecte le header `X-API-Key`.
 */
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { HttpError } from '../../middleware/error.middleware';
import type {
  AiErrorBody,
  AiFeedbackBody,
  AiFeedbackResponse,
  AiGenerateTopicBody,
  AiQuizResponse,
  AiSubjectsResponse,
} from './types';

/** Traduit le code d'erreur du Cerveau IA en HttpError exposable au client. */
function mapAiError(status: number, body: AiErrorBody | null): HttpError {
  const code = body?.code;
  switch (code) {
    case 'RATE_LIMIT':
      return new HttpError(429, 'Limite de génération atteinte (50 quiz/heure). Réessaie plus tard.');
    case 'INVALID_IMAGE':
      return new HttpError(400, body?.error ?? 'Image invalide (format ou taille > 2 Mo).');
    case 'NOT_FOUND':
      return new HttpError(404, 'Quiz introuvable.');
    case 'VALIDATION_ERROR':
      return new HttpError(422, body?.error ?? 'Données de génération invalides.');
    case 'LLM_ERROR':
      return new HttpError(502, 'Le service de génération IA est momentanément indisponible.');
    case 'INVALID_API_KEY':
      // Mauvaise config côté serveur — on ne fuit pas le détail au client.
      logger.error('Cerveau IA : clé API refusée (INVALID_API_KEY)');
      return new HttpError(502, 'Service de génération IA indisponible.');
    default:
      return new HttpError(502, `Erreur du service IA (HTTP ${status}).`);
  }
}

function ensureConfigured(): string {
  if (!env.QUIZ_AI_API_KEY) {
    logger.error('Cerveau IA : QUIZ_AI_API_KEY absent — génération désactivée');
    throw new HttpError(503, 'Le générateur de quiz IA n\'est pas configuré sur ce serveur.');
  }
  return env.QUIZ_AI_API_KEY;
}

async function parseError(res: Response): Promise<AiErrorBody | null> {
  try {
    return (await res.json()) as AiErrorBody;
  } catch {
    return null;
  }
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.QUIZ_AI_TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new HttpError(504, "Le service de génération IA n'a pas répondu à temps.");
    }
    logger.error({ err }, 'Cerveau IA : échec réseau');
    throw new HttpError(502, 'Impossible de joindre le service de génération IA.');
  } finally {
    clearTimeout(timer);
  }
}

function url(path: string): string {
  return `${env.QUIZ_AI_BASE_URL.replace(/\/$/, '')}${path}`;
}

export const quizAiClient = {
  /** GET /quiz/subjects — matières et niveaux disponibles. */
  async getSubjects(): Promise<AiSubjectsResponse> {
    const apiKey = ensureConfigured();
    return withTimeout(async (signal) => {
      const res = await fetch(url('/quiz/subjects'), {
        headers: { 'X-API-Key': apiKey },
        signal,
      });
      if (!res.ok) throw mapAiError(res.status, await parseError(res));
      return (await res.json()) as AiSubjectsResponse;
    });
  },

  /** POST /quiz/generate/topic — Mode B (matière / niveau / chapitre). */
  async generateFromTopic(body: AiGenerateTopicBody): Promise<AiQuizResponse> {
    const apiKey = ensureConfigured();
    return withTimeout(async (signal) => {
      const res = await fetch(url('/quiz/generate/topic'), {
        method: 'POST',
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
      if (!res.ok) throw mapAiError(res.status, await parseError(res));
      return (await res.json()) as AiQuizResponse;
    });
  },

  /** POST /quiz/generate/photo — Mode A (photo de devoir, multipart). */
  async generateFromPhoto(
    image: Buffer,
    filename: string,
    mimeType: string,
    childProfileId: string,
  ): Promise<AiQuizResponse> {
    const apiKey = ensureConfigured();
    return withTimeout(async (signal) => {
      const form = new FormData();
      form.append('image', new Blob([image], { type: mimeType }), filename);
      form.append('child_profile_id', childProfileId);
      const res = await fetch(url('/quiz/generate/photo'), {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
        body: form,
        signal,
      });
      if (!res.ok) throw mapAiError(res.status, await parseError(res));
      return (await res.json()) as AiQuizResponse;
    });
  },

  /** GET /quiz/{quizId} — récupère un quiz déjà généré. */
  async getQuiz(quizId: string): Promise<AiQuizResponse> {
    const apiKey = ensureConfigured();
    return withTimeout(async (signal) => {
      const res = await fetch(url(`/quiz/${encodeURIComponent(quizId)}`), {
        headers: { 'X-API-Key': apiKey },
        signal,
      });
      if (!res.ok) throw mapAiError(res.status, await parseError(res));
      return (await res.json()) as AiQuizResponse;
    });
  },

  /** POST /quiz/{quizId}/feedback — remonte le résultat de complétion. */
  async sendFeedback(quizId: string, body: AiFeedbackBody): Promise<AiFeedbackResponse> {
    const apiKey = ensureConfigured();
    return withTimeout(async (signal) => {
      const res = await fetch(url(`/quiz/${encodeURIComponent(quizId)}/feedback`), {
        method: 'POST',
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
      if (!res.ok) throw mapAiError(res.status, await parseError(res));
      return (await res.json()) as AiFeedbackResponse;
    });
  },
};

export type QuizAiClient = typeof quizAiClient;
