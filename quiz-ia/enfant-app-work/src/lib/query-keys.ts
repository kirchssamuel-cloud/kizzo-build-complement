export const qk = {
  home: ['home', 'state'] as const,
  defis: {
    list: ['defis'] as const,
    detail: (id: string) => ['defis', id] as const,
  },
  badges: ['badges'] as const,
} as const;
