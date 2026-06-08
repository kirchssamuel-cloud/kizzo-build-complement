import { api } from './client';
import type { AuthSession, Utilisateur } from '~/types/auth';
import type {
  LoginInput,
  PasswordResetSendCodeInput,
  PasswordResetUpdateInput,
  SignupInput,
  VerifyEmailInput,
} from '~/schemas/auth';

export const authApi = {
  signup: (data: SignupInput) =>
    api.post<AuthSession>('/auth/signup', data).then((r) => r.data),

  login: (data: LoginInput) =>
    api.post<AuthSession>('/auth/login', data).then((r) => r.data),

  oauthGoogle: (idToken: string) =>
    api.post<AuthSession>('/auth/oauth/google', { idToken }).then((r) => r.data),

  oauthApple: (params: { identityToken: string; prenom?: string; nom?: string }) =>
    api.post<AuthSession>('/auth/oauth/apple', params).then((r) => r.data),

  verifyEmail: (data: VerifyEmailInput) =>
    api.post<{ message: string }>('/auth/verify-email', data).then((r) => r.data),

  resendVerification: (email: string) =>
    api.post<{ message: string }>('/auth/verify-email/resend', { email }).then((r) => r.data),

  sendPasswordResetCode: (data: PasswordResetSendCodeInput) =>
    api.post<{ message: string }>('/auth/password-reset/send-code', data).then((r) => r.data),

  updatePasswordWithCode: (data: PasswordResetUpdateInput) =>
    api
      .post<{ message: string }>('/auth/password-reset/update-password', data)
      .then((r) => r.data),

  me: () => api.get<{ utilisateur: Utilisateur }>('/auth/me').then((r) => r.data),
};
