import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProfilEnfantPaired } from '~/types/auth';

const TOKEN_KEY = 'kizzo-enfant.auth.token';
const APPAREIL_KEY = 'kizzo-enfant.auth.appareilId';
const STORE_KEY = 'kizzo-enfant.auth.user';

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

type AuthState = {
  profilEnfant: ProfilEnfantPaired | null;
  token: string | null;
  appareilId: string | null;
  hydrated: boolean;
};

type AuthActions = {
  setSession: (payload: {
    token: string;
    appareilId: string;
    profilEnfant: ProfilEnfantPaired;
  }) => Promise<void>;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      profilEnfant: null,
      token: null,
      appareilId: null,
      hydrated: false,

      setSession: async ({ token, appareilId, profilEnfant }) => {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(APPAREIL_KEY, appareilId);
        set({ token, appareilId, profilEnfant, hydrated: true });
      },

      clearSession: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(APPAREIL_KEY);
        set({ token: null, appareilId: null, profilEnfant: null });
      },

      hydrate: async () => {
        const [token, appareilId] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(APPAREIL_KEY),
        ]);
        set((state) => ({
          token: token ?? state.token,
          appareilId: appareilId ?? state.appareilId,
          hydrated: true,
        }));
      },
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ profilEnfant: state.profilEnfant }),
    },
  ),
);
