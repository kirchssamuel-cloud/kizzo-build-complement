import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Smartphone, Timer } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { devicesApi } from '~/services/api/devices';
import { colors } from '~/theme/colors';
import type { AppStackParamList } from '~/navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Appairage'>;
type R = RouteProp<AppStackParamList, 'Appairage'>;

export const AppairageScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();

  const generate = useMutation({
    mutationFn: () => devicesApi.generatePairingCode(route.params.profilEnfantId),
  });

  React.useEffect(() => {
    generate.mutate();
  }, []);

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Connecter un appareil" withDivider />
      <View className="px-5 pt-6 pb-10">
        <View className="items-center pt-2">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-kz-soft">
            <Smartphone size={28} color={colors.primary} strokeWidth={2} />
          </View>
        </View>

        <Text className="mt-6 text-center font-bold text-[22px] text-kz-ink">
          Appaire l'appareil enfant
        </Text>
        <Text className="mt-2 text-center text-[14px] leading-[20px] text-kz-muted">
          Installe Kizzo Enfant sur l'appareil de ton enfant puis saisis ce code à 6 chiffres.
        </Text>

        <Card className="mt-8 items-center py-8">
          {generate.isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : generate.data ? (
            <>
              <Text className="text-[12px] uppercase tracking-[0.2em] text-kz-muted">
                Code d'appairage
              </Text>
              <Text className="mt-3 font-black text-[40px] tracking-[8px] text-kz-ink">
                {generate.data.code}
              </Text>
              <View className="mt-4 flex-row items-center gap-1.5">
                <Timer size={14} color={colors.muted} />
                <Text className="text-[12px] text-kz-muted">
                  Expire dans {Math.round(generate.data.expireDansMs / 60_000)} minutes
                </Text>
              </View>
            </>
          ) : (
            <Text className="text-kz-danger">Impossible de générer le code. Réessaye.</Text>
          )}
        </Card>

        <View className="mt-8 gap-3">
          <Text className="font-bold text-[14px] uppercase tracking-wider text-kz-muted">
            Étapes
          </Text>
          {[
            'Installe l\'app Kizzo Enfant sur l\'appareil cible.',
            'Sur cet appareil, choisis "Connecter à mes parents".',
            'Saisis le code à 6 chiffres ci-dessus.',
            'Active les permissions demandées (overlay, accessibilité).',
          ].map((step, i) => (
            <View key={i} className="flex-row gap-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-kz-primary">
                <Text className="font-bold text-[13px] text-white">{i + 1}</Text>
              </View>
              <Text className="mt-1 flex-1 text-[14px] text-kz-ink-soft">{step}</Text>
            </View>
          ))}
        </View>

        <Button className="mt-8" variant="outline" onPress={() => navigation.popToTop()}>
          Terminer plus tard
        </Button>
      </View>
    </Screen>
  );
};
