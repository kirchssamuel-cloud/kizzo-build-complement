/**
 * Types du Cerveau IA (Kizzo LMS) — cf. documentation API v1.0.
 * Base : http://92.222.197.147:8000 — auth header `X-API-Key`.
 *
 * Ces types décrivent le contrat tel que renvoyé par le service IA. Le backend
 * Kizzo les normalise ensuite vers son propre modèle (`Defi` / `QuestionDefi`).
 */

/** Types de questions supportés par le Cerveau IA. */
export type AiQuestionType = 'QCM4' | 'VF' | 'FILL' | 'CALC' | 'SORT' | 'MATCH';

export interface AiOption {
  label: string;
  value: string;
}

export interface AiMatchPair {
  left: string;
  right: string;
}

/** Une question telle que renvoyée par le Cerveau IA (union des 6 types). */
export interface AiQuestion {
  id?: string;
  type: AiQuestionType;
  question: string;
  /** QCM4 / VF. */
  options?: AiOption[];
  /** SORT : liste à remettre dans l'ordre. */
  items?: string[];
  /** MATCH : paires à associer. */
  pairs?: AiMatchPair[];
  /** Chaîne (QCM4/VF/FILL/CALC) ou tableau (SORT/MATCH). */
  correct_answer: string | string[];
  explanation?: string;
  difficulty?: number;
  hint?: string;
}

export interface AiQuizMetadata {
  matiere: string;
  niveau: string;
  chapitre?: string;
  difficulte?: number;
}

/** Réponse des endpoints de génération et de récupération de quiz. */
export interface AiQuizResponse {
  quiz_id: string;
  mode: 'photo' | 'topic';
  metadata: AiQuizMetadata;
  questions: AiQuestion[];
  is_fallback: boolean;
  generated_at: string;
  generation_ms: number;
}

export interface AiSubject {
  matiere: string;
  label: string;
  niveaux: string[];
}

export interface AiSubjectsResponse {
  subjects: AiSubject[];
}

/** Corps attendu par POST /quiz/generate/topic. */
export interface AiGenerateTopicBody {
  child_profile_id: string;
  matiere: string;
  niveau: string;
  chapitre?: string;
  difficulte?: number;
  nb_questions?: number;
  exclude_hashes?: string[];
}

/** Corps attendu par POST /quiz/{quizId}/feedback. */
export interface AiFeedbackBody {
  child_profile_id: string;
  score: number;
  time_spent_ms: number;
  answers?: Array<{ question_id: string; answer: string; correct: boolean }>;
}

export interface AiFeedbackResponse {
  status: string;
  quiz_id: string;
}

/** Enveloppe d'erreur structurée renvoyée par le Cerveau IA. */
export interface AiErrorBody {
  error: string;
  code: string;
}
