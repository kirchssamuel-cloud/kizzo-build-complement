import axios, { AxiosError } from 'axios';
import { env } from '~/constants/env';
import { useAuthStore } from '~/store/auth.store';

export const api = axios.create({
  baseURL: env.API_URL,
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const { token, appareilId } = useAuthStore.getState();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  if (appareilId) {
    config.headers.set('X-Kizzo-Appareil-Id', appareilId);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const { token } = useAuthStore.getState();
      if (token) await useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  },
);
