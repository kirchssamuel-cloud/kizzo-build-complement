import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '~/screens/home/HomeScreen';
import { LockedScreen } from '~/screens/home/LockedScreen';
import { DefisScreen } from '~/screens/defis/DefisScreen';
import { DefiPlayScreen } from '~/screens/defis/DefiPlayScreen';
import { QuizStartScreen } from '~/screens/quiz/QuizStartScreen';
import { QuizPlayScreen } from '~/screens/quiz/QuizPlayScreen';
import { QuizHistoryScreen } from '~/screens/quiz/QuizHistoryScreen';
import { BadgesScreen } from '~/screens/badges/BadgesScreen';
import { ActivityScreen } from '~/screens/activity/ActivityScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
  >
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Defis" component={DefisScreen} />
    <Stack.Screen name="DefiPlay" component={DefiPlayScreen} />
    <Stack.Screen name="QuizStart" component={QuizStartScreen} />
    <Stack.Screen name="QuizPlay" component={QuizPlayScreen} />
    <Stack.Screen name="QuizHistory" component={QuizHistoryScreen} />
    <Stack.Screen name="Badges" component={BadgesScreen} />
    <Stack.Screen name="Activity" component={ActivityScreen} />
    <Stack.Screen name="Locked" component={LockedScreen} />
  </Stack.Navigator>
);
