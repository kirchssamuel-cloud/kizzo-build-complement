import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '~/screens/auth/WelcomeScreen';
import { OnboardingScreen } from '~/screens/auth/OnboardingScreen';
import { LoginScreen } from '~/screens/auth/LoginScreen';
import { SignupScreen } from '~/screens/auth/SignupScreen';
import { VerifyEmailScreen } from '~/screens/auth/VerifyEmailScreen';
import { ForgotPasswordScreen } from '~/screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '~/screens/auth/ResetPasswordScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Welcome"
    screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);
