import * as React from 'react';
import { Alert, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useMutation } from '@tanstack/react-query';
import {
  type RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Lock, Moon, ShieldCheck } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { OrDivider } from '~/components/ui/Divider';
import { Text } from '~/components/ui/Text';
import { HomeScreen } from './HomeScreen';
import { useTheme } from '~/theme/theme-provider';
import { cn } from '~/lib/cn';
import { colors } from '~/theme/colors';
import type { AppStackParamList } from '~/navigation/types';
import { enforcement } from '~/native/enforcement';
import { useAuthStore } from '~/store/auth.store';
import { requestsApi } from '~/services/api/requests';

type R = RouteProp<AppStackParamList, 'Locked'>;

/** Message affiché sur l'overlay système natif selon la raison du verrou. */
const LOCK_MESSAGE: Record<'quota' | 'nuit' | 'parent', string> = {
  quota: "Temps d'écran écoulé — réussis un quiz pour continuer.",
  nuit: "C'est l'heure de dormir. À demain matin !",
  parent: 'Appareil verrouillé par tes parents.',
};
type Nav = NativeStackNavigationProp<AppStackParamList, 'Locked'>;

const LockIcon: React.FC<{ Icon: typeof Lock }> = ({ Icon }) => (
  <View className="h-[86px] w-[160px] items-center justify-center">
    {}
    <View
      className="absolute h-2 w-2 rounded-full bg-kz-cyan"
      style={{ left: 24, top: 35, opacity: 0.7 }}
    />
    <View
      className="absolute h-[11px] w-[11px] rounded-full bg-kz-cyan"
      style={{ left: 120, top: 16, opacity: 0.6 }}
    />
    <View
      className="absolute h-2 w-2 rounded-full bg-kz-cyan"
      style={{ left: 35, top: 71, opacity: 0.5 }}
    />
    <View
      className="absolute h-1.5 w-1.5 rounded-full bg-kz-cyan"
      style={{ left: 114, top: 75, opacity: 0.5 }}
    />
    <View
      className="absolute h-1.5 w-1.5 rounded-full bg-kz-cyan"
      style={{ left: 47, top: 5, opacity: 0.4 }}
    />

    <View
      className="h-[60px] w-[60px] items-center justify-center rounded-full bg-kz-cyan shadow-cyan-cta"
      style={{
        shadowColor: colors.cyan,
        shadowOpacity: 0.26,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <Icon size={30} color="#0a1526" strokeWidth={2.2} />
    </View>
  </View>
);

export const LockedScreen: React.FC = () => {
  const route = useRoute<R>();
  const navigation = useNavigation<Nav>();
  const { isDark } = useTheme();
  const raison = route.params?.raison ?? 'quota';
  const profilEnfant = useAuthStore((s) => s.profilEnfant);

  const demandeTemps = useMutation({
    mutationFn: (minutes: 15 | 30 | 60) => {
      if (!profilEnfant) throw new Error('Profil enfant introuvable');
      return requestsApi.create(profilEnfant.id, minutes);
    },
    onSuccess: () =>
      Alert.alert(
        'Demande envoyée',
        'Tes parents ont reçu ta demande de temps. Patiente un peu !',
      ),
    onError: () =>
      Alert.alert(
        'Oups',
        "La demande n'a pas pu être envoyée. Réessaie plus tard.",
      ),
  });

  const demanderDuTemps = () => {
    Alert.alert('Demander du temps', 'Combien de minutes veux-tu demander ?', [
      { text: '15 min', onPress: () => demandeTemps.mutate(15) },
      { text: '30 min', onPress: () => demandeTemps.mutate(30) },
      { text: '1 heure', onPress: () => demandeTemps.mutate(60) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const config = {
    quota: { Icon: Lock, title: "C'est l'heure d'un quiz !", body: 'Ton temps est écoulé' },
    nuit: { Icon: Moon, title: "C'est l'heure de dormir 🌙", body: 'À demain matin !' },
    parent: {
      Icon: ShieldCheck,
      title: 'Tes parents ont verrouillé 🛡️',
      body: 'Pose ton appareil et reviens plus tard.',
    },
  }[raison];

  /**
   * Applique le verrou système natif tant que l'écran est affiché.
   * - À l'affichage : `enforcement.lockNow(...)` pose l'overlay système (Lot E natif).
   * - À la sortie (quiz lancé, temps regagné, code parental) : `enforcement.unlock()`.
   * Repli no-op sûr si la couche native n'est pas présente (Expo Go / build sans
   * config plugin / iOS) — l'UI React Native ci-dessous reste l'écran de secours.
   */
  useFocusEffect(
    React.useCallback(() => {
      void enforcement.lockNow(LOCK_MESSAGE[raison]);
      return () => {
        void enforcement.unlock();
      };
    }, [raison]),
  );

  return (
    <View className="flex-1">
      {}
      <View className="absolute inset-0">
        <HomeScreen />
      </View>

      {}
      <BlurView
        intensity={isDark ? 25 : 35}
        tint={isDark ? 'dark' : 'light'}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: isDark ? 'rgba(10,21,38,0.58)' : 'rgba(244,248,250,0.58)',
        }}
      />

      {}
      <View className="flex-1 items-center justify-center px-6">
        <View
          className={cn(
            'w-full max-w-[344px] items-center gap-6 rounded-[16px] border p-6',
            isDark ? 'border-white/5' : 'border-kz-cyan/20',
          )}
          style={{
            backgroundColor: isDark
              ? 'rgba(21,42,74,0.97)'
              : 'rgba(255,255,255,0.97)',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 50,
            shadowOffset: { width: 0, height: 25 },
          }}
        >
          <LockIcon Icon={config.Icon} />

          <View className="items-center gap-2">
            <Text className="text-center font-heading-semi text-[18px] text-kz-ink dark:text-kz-white">
              {config.title}
            </Text>
            <Text className="text-center font-medium text-[14px] text-kz-ink-soft">
              {config.body}
            </Text>
          </View>

          <View className="w-full gap-[22px]">
            {raison === 'quota' ? (
              <>
                <Button onPress={() => navigation.navigate('QuizStart')}>
                  Faire un quiz
                </Button>
                <Button
                  variant="outline"
                  onPress={demanderDuTemps}
                  disabled={demandeTemps.isPending}
                >
                  Demander du temps
                </Button>
                <OrDivider />
                <View className="items-center">
                  <Text className="font-semibold text-[16px] text-kz-orange">
                    Saisir le code parental
                  </Text>
                </View>
              </>
            ) : (
              <Button variant="outline" onPress={() => navigation.goBack()}>
                Compris
              </Button>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
