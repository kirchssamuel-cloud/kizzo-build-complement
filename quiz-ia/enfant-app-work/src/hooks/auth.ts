import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '~/services/api/auth';
import { useAuthStore } from '~/store/auth.store';
import type { PairInput } from '~/schemas/auth';

export const usePairDevice = () => {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PairInput) => authApi.pair(input),
    onSuccess: async (data) => {
      await setSession({
        token: data.token,
        appareilId: data.appareilId,
        profilEnfant: data.profilEnfant,
      });
      queryClient.invalidateQueries();
    },
  });
};

export const useLogout = () => {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await clearSession();
      queryClient.clear();
    },
  });
};
