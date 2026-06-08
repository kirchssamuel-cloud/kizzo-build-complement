import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Utilisateur } from '~/types/auth';

const TOKEN_KEY = 'kizzo-parent.auth.token';
const STORE_KEY = 'kizzo-parent.auth.user';

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

type AuthState = {
  utilisateur: Utilisateur | null;
  token: string | null;
  hydrated: boolean;
};

type AuthActions = {
  setSession: (payload: { utilisateur: Utilisateur; token: string }) => Promise<void>;
  setUtilisateur: (utilisateur: Utilisateur) => void;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      utilisateur: null,
      token: null,
      hydrated: false,

      setSession: async ({ utilisateur, token }) => {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        set({ utilisateur, token, hydrated: true });
      },

      setUtilisateur: (utilisateur) => set({ utilisateur }),

      clearSession: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        set({ utilisateur: null, token: null });
      },

      hydrate: async () => {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        set((state) => ({ token: token ?? state.token, hydrated: true }));
      },
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ utilisateur: state.utilisateur }),
    },
  ),
);
