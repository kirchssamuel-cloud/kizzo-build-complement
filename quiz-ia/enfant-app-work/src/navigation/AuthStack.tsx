import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '~/screens/auth/WelcomeScreen';
import { PairCodeScreen } from '~/screens/auth/PairCodeScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Welcome"
    screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="PairCode" component={PairCodeScreen} />
  </Stack.Navigator>
);
