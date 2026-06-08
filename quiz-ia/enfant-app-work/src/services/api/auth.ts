import { api } from './client';
import type { SessionEnfant } from '~/types/auth';
import type { PairInput } from '~/schemas/auth';

export const authApi = {
  pair: (input: PairInput) =>
    api.post<SessionEnfant>('/auth/pair-child', input).then((r) => r.data),
};
