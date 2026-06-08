import * as React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '~/components/layout/Screen';
import { Button } from '~/components/ui/Button';
import { Logo } from '~/components/ui/Logo';
import { Text } from '~/components/ui/Text';
import { ThemeToggle } from '~/components/ui/ThemeToggle';
import type { AuthStackParamList } from '~/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  return (
    <Screen scroll noPadding glow>
      <View className="flex-1 px-6 pt-[60px] pb-10">
        {}
        <View className="absolute right-6 top-3 z-10">
          <ThemeToggle />
        </View>

        <View className="items-center">
          <Logo size={100} variant="wordmark" />

          <View className="mt-9 items-center">
            <Text className="text-center font-heading text-[28px] leading-[34px] text-kz-ink dark:text-kz-white">
              Prenez le contrôle
            </Text>
            <Text className="text-center font-heading text-[28px] leading-[34px] text-kz-ink dark:text-kz-white">
              en toute sérénité
            </Text>
          </View>
          <View className="mt-6 items-center gap-1.5">
            <Text className="text-center text-[14px] text-kz-ink-soft dark:text-kz-white/70">
              Accompagnez les habitudes
            </Text>
            <Text className="text-center text-[14px] text-kz-ink-soft dark:text-kz-white/70">
              numériques de votre enfant
            </Text>
          </View>
        </View>

        <View className="mt-auto gap-[22px] pt-10">
          <Button
            onPress={() => navigation.navigate('Onboarding', { target: 'signup', step: 1 })}
          >
            Commencer
          </Button>
          <Button
            variant="outline"
            onPress={() => navigation.navigate('Onboarding', { target: 'login', step: 1 })}
          >
            Se connecter
          </Button>

          <View className="mt-6 flex-row items-center justify-center gap-2">
            <Text className="text-[11.9px] text-kz-ink-muted dark:text-kz-white/50">
              Confidentialité
            </Text>
            <Text className="text-[11.9px] text-kz-ink-muted dark:text-kz-white/50">
              •
            </Text>
            <Text className="text-[11.9px] text-kz-ink-muted dark:text-kz-white/50">
              Conditions
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
};
