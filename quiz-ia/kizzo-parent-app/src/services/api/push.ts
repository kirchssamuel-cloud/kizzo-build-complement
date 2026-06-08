import { api } from './client';

export type PlateformePush = 'ios' | 'android' | 'tablette';

export type AppareilPush = {
  token: string;
  plateforme: PlateformePush;
  langue: 'fr' | 'en' | null;
  derniereUtilisation: string;
};

/**
 * Tokens push parent (FCM/APNs). Le backend stocke le token dans `AppareilPush`
 * et l'utilise comme destinataire des notifications. Aucune clé/credential push
 * ne transite par le client : seul le token de l'appareil est envoyé.
 */
export const pushApi = {
  list: () =>
    api.get<{ tokens: AppareilPush[] }>('/parent/push-tokens').then((r) => r.data.tokens),

  register: (token: string, plateforme: PlateformePush, langue?: 'fr' | 'en') =>
    api
      .post<{ appareilPush: AppareilPush }>('/parent/push-tokens', {
        token,
        plateforme,
        langue,
      })
      .then((r) => r.data.appareilPush),

  unregister: (token: string) =>
    api
      .post<{ supprime: number }>('/parent/push-tokens/unregister', { token })
      .then((r) => r.data),
};
