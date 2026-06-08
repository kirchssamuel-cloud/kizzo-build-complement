import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthTarget = 'signup' | 'login';

export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: { target: AuthTarget; step?: 1 | 2 | 3 };
  Login: undefined;
  Signup: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type AppTabsParamList = {
  Dashboard: undefined;
  Enfants: undefined;
  Rapports: undefined;
  Reglages: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabsParamList>;
  EnfantDetail: { id: string };
  AjoutEnfant: undefined;
  Appairage: { profilEnfantId: string };
  Notifications: undefined;
  AjustementTheme: undefined;
  WebFilter: { childId: string };
  Apps: { childId: string };
  ActivityReport: { childId: string };
  Account: undefined;
  Abonnement: undefined;
  UnlockRequests: { childId?: string } | undefined;
  NotificationPreferences: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
