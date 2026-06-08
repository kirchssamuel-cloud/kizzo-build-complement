import 'react-native-gesture-handler';
import './global.css';

import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { queryClient } from '~/lib/query-client';
import { useAppFonts } from '~/lib/fonts';
import { RootNavigator } from '~/navigation/RootNavigator';
import { ThemeProvider, useTheme } from '~/theme/theme-provider';
import { kizzoToastConfig } from '~/components/ui/KizzoToast';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppInner() {
  const { isDark } = useTheme();
  return (
    <>
      <RootNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Toast config={kizzoToastConfig} topOffset={56} />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useAppFonts();

  React.useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AppInner />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
