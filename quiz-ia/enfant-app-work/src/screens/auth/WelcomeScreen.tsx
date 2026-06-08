import * as React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Sparkles } from 'lucide-react-native';
import { ThemeToggle } from '~/components/ui/ThemeToggle';
import { Screen } from '~/components/layout/Screen';
import { Button } from '~/components/ui/Button';
import { Logo } from '~/components/ui/Logo';
import { Text } from '~/components/ui/Text';
import { colors } from '~/theme/colors';
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

          <View className="mt-9 flex-row items-center gap-2 rounded-full border border-kz-cyan/30 px-4 py-2">
            <Sparkles size={14} color={colors.cyan} />
            <Text className="font-medium text-[12px] text-kz-cyan">Application enfant</Text>
          </View>

          <View className="mt-6 items-center">
            <Text className="text-center font-heading text-[28px] leading-[34px] text-kz-ink dark:text-kz-white">
              Bienvenue dans
            </Text>
            <Text className="text-center font-heading text-[28px] leading-[34px] text-kz-ink dark:text-kz-white">
              ton aventure ✨
            </Text>
          </View>

          <View className="mt-6 items-center gap-1.5 px-4">
            <Text className="text-center text-[14px] text-kz-ink-soft">
              Demande à tes parents un code à 6 chiffres
            </Text>
            <Text className="text-center text-[14px] text-kz-ink-soft">
              pour connecter cet appareil.
            </Text>
          </View>
        </View>

        <View className="mt-auto pt-10">
          <Button onPress={() => navigation.navigate('PairCode')}>
            J'ai un code parent
          </Button>

          <Text className="mt-6 text-center text-[12px] text-kz-ink-muted">
            Tes données sont protégées. Aucune publicité, jamais.
          </Text>
        </View>
      </View>
    </Screen>
  );
};
