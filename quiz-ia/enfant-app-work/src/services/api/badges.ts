import { api } from './client';

export type TypeBadge =
  | 'lecteur'
  | 'defis_champion'
  | 'precis'
  | 'ponctuel'
  | 'curieux'
  | 'matinal'
  | 'marathon'
  | 'artistique'
  | 'scientifique';

export interface BadgeCatalogue {
  type: TypeBadge;
  titre: string;
  description: string;
  acquis: boolean;
  dateObtention: string | null;
}

export interface BadgesResponse {
  badges: BadgeCatalogue[];
  nombreAcquis: number;
  total: number;
}

export const badgesApi = {
  list: () => api.get<BadgesResponse>('/enfant/badges').then((r) => r.data),
};
