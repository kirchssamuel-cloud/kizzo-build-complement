import { api } from './client';
import type { ProfilEnfant } from '~/types/api';
import type { CreateChildInput } from '~/schemas/enfants';

export const enfantsApi = {
  list: () =>
    api.get<{ enfants: ProfilEnfant[] }>('/parent/children').then((r) => r.data.enfants),

  create: (input: CreateChildInput) =>
    api
      .post<{ enfant: ProfilEnfant }>('/parent/children', {
        ...input,
        dateNaissance: input.dateNaissance.toISOString(),
      })
      .then((r) => r.data.enfant),

  get: (id: string) =>
    api.get<{ enfant: ProfilEnfant }>(`/parent/children/${id}`).then((r) => r.data.enfant),

  remove: (id: string) =>
    api.delete<{ message: string }>(`/parent/children/${id}`).then((r) => r.data),

  stats: (id: string) =>
    api
      .get<{
        stats: {
          tempsEcranAujourdhuiSeconds: number;
          nombreDefisAujourdhui: number;
          nombreBadges: number;
          topApps: Array<{ nomApp: string; dureeSeconds: number; categorie: string }>;
        };
      }>(`/parent/children/${id}/stats`)
      .then((r) => r.data.stats),
};
