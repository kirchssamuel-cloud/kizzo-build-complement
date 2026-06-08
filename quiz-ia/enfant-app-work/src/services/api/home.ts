import { api } from './client';
import type { HomeState } from '~/types/auth';

export const homeApi = {
  state: () => api.get<HomeState>('/enfant/home/state').then((r) => r.data),
};
