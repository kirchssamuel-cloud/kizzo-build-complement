import { api } from './client';

/**
 * Client typé du BFF Quiz IA (`/api/quiz`). L'app n'appelle JAMAIS le Cerveau IA
 * (LMS) directement : le backend injecte la clé serveur et masque les réponses.
 * La correction se fait côté serveur — d'où l'absence de `reponse`/`explication`
 * dans `QuizQuestion`.
 */

/** Type de question tel qu'exposé par le backend (enum Prisma). */
export type QuizQuestionType =
  | 'qcm'
  | 'vrai_faux'
  | 'texte'
  | 'calcul'
  | 'tri'
  | 'association';

export type QuizOption = { label: string; value: string };
export type QuizPair = { left: string; right: string };

/** `options` change de forme selon le type (cf. `normalizeAiQuestion` côté backend). */
export type QuizQuestion = {
  id: string;
  ordre: number;
  enonce: string;
  type: QuizQuestionType;
  options:
    | QuizOption[] // qcm / vrai_faux
    | { items: string[] } // tri
    | { pairs: QuizPair[] } // association
    | null; // texte / calcul
  imageUrl: string | null;
};

export type Quiz = {
  id: string;
  titre: string;
  description: string | null;
  matiere: string;
  difficulte: number;
  nombreQuestions: number;
  tempsRecompense: number;
  sourceIa: boolean;
  questions: QuizQuestion[];
};

/** Récap par question (E16/E17) : jamais la bonne réponse, seulement juste/faux. */
export type QuizResultatQuestion = {
  questionId: string;
  ordre: number;
  estCorrecte: boolean;
};

export type QuizResult = {
  score: number;
  reussi: boolean;
  tempsCredite: number;
  correct: number;
  total: number;
  resultats: QuizResultatQuestion[];
};

export type QuizHistoryItem = {
  id: string;
  date: string;
  titre: string;
  matiere: string;
  score: number;
  reussi: boolean;
  tempsCredite: number;
};

export type GenerateTopicPayload = {
  profilEnfantId: string;
  matiere: string;
  niveau: string;
  chapitre?: string;
  difficulte?: number;
  nombreQuestions?: number;
};

export type SubmitQuizPayload = {
  profilEnfantId: string;
  reponses: Array<{ questionId: string; reponse: string }>;
  dureeSeconds?: number;
};

export const quizApi = {
  generateFromTopic: (payload: GenerateTopicPayload) =>
    api.post<{ quiz: Quiz }>('/quiz/generate/topic', payload).then((r) => r.data.quiz),

  generateFromPhoto: (profilEnfantId: string, photo: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append('profilEnfantId', profilEnfantId);
    // React Native FormData accepte un objet { uri, name, type } pour les fichiers.
    form.append('image', {
      uri: photo.uri,
      name: photo.name,
      type: photo.type,
    } as unknown as Blob);
    return api
      .post<{ quiz: Quiz }>('/quiz/generate/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.quiz);
  },

  get: (quizId: string) =>
    api.get<{ quiz: Quiz }>(`/quiz/${quizId}`).then((r) => r.data.quiz),

  submit: (quizId: string, payload: SubmitQuizPayload) =>
    api.post<QuizResult>(`/quiz/${quizId}/submit`, payload).then((r) => r.data),

  history: (childId: string) =>
    api
      .get<{ tentatives: QuizHistoryItem[] }>(`/quiz/history/${childId}`)
      .then((r) => r.data.tentatives),
};
