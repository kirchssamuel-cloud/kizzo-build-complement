import { api } from './client';
import type {
  DemandeTemps,
  EtatAppareil,
  FiltreContenu,
  NiveauFiltre,
  PreferenceNotification,
  ProfilParent,
  RapportActivite,
  RegleApp,
  StatutDemandeTemps,
} from '~/types/controls';

export type UpdateWebFilterInput = {
  niveau: NiveauFiltre;
  categoriesBloquees?: string[];
  whitelistUrls?: string[];
  blacklistUrls?: string[];
  safeSearch?: boolean;
};

export type UpsertAppRuleInput = {
  bundleId: string;
  nomApp: string;
  categorie?: RegleApp['categorie'];
  autorisee?: boolean;
  limiteQuotidienne?: number | null;
};

export type UpdateProfileInput = {
  prenom?: string;
  nom?: string;
  telephone?: string;
  avatarUrl?: string;
  langue?: 'fr' | 'en';
};

export type DeleteAccountInput = {
  password?: string;
  confirmation: 'SUPPRIMER';
};

export const webFilterApi = {
  get: (childId: string) =>
    api.get<{ filtre: FiltreContenu }>(`/parent/web-filter/${childId}`).then((r) => r.data.filtre),
  update: (childId: string, input: UpdateWebFilterInput) =>
    api
      .put<{ filtre: FiltreContenu }>(`/parent/web-filter/${childId}`, input)
      .then((r) => r.data.filtre),
};

export const appsApi = {
  list: (childId: string) =>
    api.get<{ apps: RegleApp[] }>(`/parent/apps/${childId}`).then((r) => r.data.apps),
  upsert: (childId: string, input: UpsertAppRuleInput) =>
    api.put<{ app: RegleApp }>(`/parent/apps/${childId}`, input).then((r) => r.data.app),
  remove: (childId: string, bundleId: string) =>
    api
      .delete<{ ok: boolean }>(`/parent/apps/${childId}/${encodeURIComponent(bundleId)}`)
      .then((r) => r.data),
};

export const profileApi = {
  get: () => api.get<{ profil: ProfilParent }>('/parent/profile').then((r) => r.data.profil),
  update: (input: UpdateProfileInput) =>
    api.put<{ profil: ProfilParent }>('/parent/profile', input).then((r) => r.data.profil),
  deleteAccount: (input: DeleteAccountInput) =>
    api.delete<{ ok: boolean }>('/parent/account', { data: input }).then((r) => r.data),
};

export const activityApi = {
  report: (childId: string, jours = 7) =>
    api
      .get<RapportActivite>(`/parent/activity/${childId}/report`, { params: { jours } })
      .then((r) => r.data),
};

export type RespondRequestInput = {
  accepter: boolean;
  reponse?: string;
  minutes?: number;
};

export const unlockRequestsApi = {
  list: (params?: { statut?: StatutDemandeTemps; childId?: string }) =>
    api
      .get<{ demandes: DemandeTemps[] }>('/parent/unlock-requests', { params })
      .then((r) => r.data.demandes),
  respond: (demandeId: string, input: RespondRequestInput) =>
    api
      .post<{ demande: DemandeTemps }>(`/parent/unlock-requests/${demandeId}/respond`, input)
      .then((r) => r.data.demande),
};

export const deviceStateApi = {
  list: (childId: string) =>
    api
      .get<{ appareils: EtatAppareil[] }>(`/parent/device-state/${childId}`)
      .then((r) => r.data.appareils),
};

export type UpdatePreferencesInput = { preferences: PreferenceNotification[] };

export const notifPrefsApi = {
  get: () =>
    api
      .get<{ preferences: PreferenceNotification[] }>('/parent/notifications/preferences')
      .then((r) => r.data.preferences),
  update: (input: UpdatePreferencesInput) =>
    api
      .put<{ preferences: PreferenceNotification[] }>(
        '/parent/notifications/preferences',
        input,
      )
      .then((r) => r.data.preferences),
};

export const rgpdApi = {
  // Renvoie l'objet d'export brut (JSON portabilité).
  export: () => api.get<unknown>('/parent/account/export').then((r) => r.data),
};
