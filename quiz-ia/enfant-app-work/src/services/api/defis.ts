import { api } from './client';

export type DefiSummary = {
  id: string;
  titre: string;
  description: string | null;
  matiere: string;
  difficulte: number;
  nombreQuestions: number;
  tempsRecompense: number;
};

export type DefiDetail = DefiSummary & {
  questions: Array<{
    id: string;
    ordre: number;
    enonce: string;
    type: 'qcm' | 'vrai_faux' | 'texte' | 'calcul';
    options: string[] | null;
    explication: string | null;
  }>;
};

export type DefiResult = {
  score: number;
  reussi: boolean;
  tempsCredite: number;
};

export const defisApi = {
  list: () =>
    api.get<{ defis: DefiSummary[] }>('/enfant/challenges').then((r) => r.data.defis),

  get: (id: string) =>
    api.get<{ defi: DefiDetail }>(`/enfant/challenges/${id}`).then((r) => r.data.defi),

  submit: (
    id: string,
    payload: {
      profilEnfantId: string;
      reponses: Array<{ questionId: string; reponse: string }>;
      dureeSeconds?: number;
    },
  ) => api.post<DefiResult>(`/enfant/challenges/${id}/submit`, payload).then((r) => r.data),
};
