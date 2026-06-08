import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppTabs } from './AppTabs';
import { EnfantDetailScreen } from '~/screens/enfants/EnfantDetailScreen';
import { AjoutEnfantScreen } from '~/screens/enfants/AjoutEnfantScreen';
import { AppairageScreen } from '~/screens/enfants/AppairageScreen';
import { NotificationsScreen } from '~/screens/dashboard/NotificationsScreen';
import { WebFilterScreen } from '~/screens/controls/WebFilterScreen';
import { AppsScreen } from '~/screens/controls/AppsScreen';
import { ScreenTimeScreen } from '~/screens/controls/ScreenTimeScreen';
import { ActivityReportScreen } from '~/screens/controls/ActivityReportScreen';
import { AccountScreen } from '~/screens/controls/AccountScreen';
import { AbonnementScreen } from '~/screens/controls/AbonnementScreen';
import { UnlockRequestsScreen } from '~/screens/controls/UnlockRequestsScreen';
import { NotificationPreferencesScreen } from '~/screens/controls/NotificationPreferencesScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
  >
    <Stack.Screen name="Tabs" component={AppTabs} />
    <Stack.Screen name="EnfantDetail" component={EnfantDetailScreen} />
    <Stack.Screen name="AjoutEnfant" component={AjoutEnfantScreen} />
    <Stack.Screen name="Appairage" component={AppairageScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="WebFilter" component={WebFilterScreen} />
    <Stack.Screen name="Apps" component={AppsScreen} />
    <Stack.Screen name="ScreenTime" component={ScreenTimeScreen} />
    <Stack.Screen name="ActivityReport" component={ActivityReportScreen} />
    <Stack.Screen name="Account" component={AccountScreen} />
    <Stack.Screen name="Abonnement" component={AbonnementScreen} />
    <Stack.Screen name="UnlockRequests" component={UnlockRequestsScreen} />
    <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
  </Stack.Navigator>
);
