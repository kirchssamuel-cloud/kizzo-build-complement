import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '~/store/auth.store';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import type { RootStackParamList } from './types';
import { colors } from '~/theme/colors';
import { useTheme } from '~/theme/theme-provider';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  const { isDark } = useTheme();

  React.useEffect(() => {
    hydrate().catch(() => null);
  }, [hydrate]);

  const theme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.bgDark,
          card: colors.cardDark,
          text: colors.bg,
          primary: '#7A9BA4',
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.bg,
          card: colors.card,
          text: colors.ink,
          primary: colors.primary,
        },
      };

  return (
    <NavigationContainer theme={theme}>
      {!hydrated ? (
        <View className="flex-1 items-center justify-center bg-kz-bg">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token ? (
            <Stack.Screen name="App" component={AppStack} />
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
