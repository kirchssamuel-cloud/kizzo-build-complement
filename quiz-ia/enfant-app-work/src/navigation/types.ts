import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  PairCode: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Defis: undefined;
  DefiPlay: { id: string };
  // Parcours quiz IA (Lot B — E09-E19, E30)
  QuizStart: undefined;
  QuizPlay: { quizId: string };
  QuizHistory: undefined;
  Badges: undefined;
  Activity: undefined;
  Locked: { raison?: 'quota' | 'nuit' | 'parent' };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
