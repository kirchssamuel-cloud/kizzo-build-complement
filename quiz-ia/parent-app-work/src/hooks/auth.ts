import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authApi } from '~/services/api/auth';
import { useAuthStore } from '~/store/auth.store';
import { qk } from '~/lib/query-keys';
import type {
  LoginInput,
  PasswordResetSendCodeInput,
  PasswordResetUpdateInput,
  SignupInput,
  VerifyEmailInput,
} from '~/schemas/auth';

export const useMe = () => {
  const token = useAuthStore((s) => s.token);
  const setUtilisateur = useAuthStore((s) => s.setUtilisateur);
  return useQuery({
    queryKey: qk.auth.me,
    queryFn: async () => {
      const data = await authApi.me();
      setUtilisateur(data.utilisateur);
      return data.utilisateur;
    },
    enabled: !!token,
  });
};

export const useLogin = () => {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: async (data) => {
      await setSession({ utilisateur: data.utilisateur, token: data.token });
      queryClient.setQueryData(qk.auth.me, data.utilisateur);
    },
  });
};

export const useSignup = () =>
  useMutation({
    mutationFn: (input: SignupInput) =>
      authApi.signup({
        email: input.email,
        password: input.password,
        prenom: input.prenom,
        nom: input.nom,
        acceptCgu: input.acceptCgu,
        optInNewsletter: input.optInNewsletter,
      } as SignupInput),
  });

export const useVerifyEmail = () =>
  useMutation({ mutationFn: (input: VerifyEmailInput) => authApi.verifyEmail(input) });

export const useResendVerification = () =>
  useMutation({ mutationFn: (email: string) => authApi.resendVerification(email) });

export const useSendPasswordResetCode = () =>
  useMutation({
    mutationFn: (input: PasswordResetSendCodeInput) => authApi.sendPasswordResetCode(input),
  });

export const useUpdatePasswordWithCode = () =>
  useMutation({
    mutationFn: (input: PasswordResetUpdateInput) => authApi.updatePasswordWithCode(input),
  });

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

export const useSignInWithApple = () => {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async () => {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('Apple : aucun token reçu');
      const result = await authApi.oauthApple({
        identityToken: credential.identityToken,
        prenom: credential.fullName?.givenName ?? undefined,
        nom: credential.fullName?.familyName ?? undefined,
      });
      await setSession({ utilisateur: result.utilisateur, token: result.token });
      return result;
    },
  });
};
