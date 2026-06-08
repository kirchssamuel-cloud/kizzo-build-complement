export const qk = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  enfants: {
    list: ['enfants'] as const,
    detail: (id: string) => ['enfants', id] as const,
    stats: (id: string) => ['enfants', id, 'stats'] as const,
  },
  appareils: {
    list: ['appareils'] as const,
  },
  tempsEcran: {
    rules: (childId: string) => ['screen-time', childId, 'rules'] as const,
    usage: (childId: string) => ['screen-time', childId, 'usage'] as const,
  },
  notifications: ['notifications'] as const,
} as const;
