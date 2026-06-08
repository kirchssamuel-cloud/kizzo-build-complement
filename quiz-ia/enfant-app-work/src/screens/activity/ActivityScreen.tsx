import * as React from 'react';
import { View } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useHomeState } from '~/hooks/home';
import { colors } from '~/theme/colors';

const formatMin = (seconds: number) => {
  const total = Math.round(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`;
};

export const ActivityScreen: React.FC = () => {
  const home = useHomeState();

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Mon activité" />
      <View className="px-5 pt-4 pb-10">
        <Text className="font-bold text-[24px] text-kz-ink">Ma journée</Text>
        <Card className="mt-4 items-center py-8">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-kz-soft">
            <BarChart3 size={22} color={colors.primary} />
          </View>
          <Text className="mt-4 text-[13px] uppercase tracking-wider text-kz-muted">
            Temps d'écran aujourd'hui
          </Text>
          <Text className="mt-2 font-black text-[40px] text-kz-ink">
            {home.data ? formatMin(home.data.tempsUtiliseSeconds) : '—'}
          </Text>
        </Card>

        <Text className="mt-8 mb-3 font-bold text-[14px] uppercase tracking-wider text-kz-muted">
          Ton aventure
        </Text>
        <Card>
          <Text className="text-[14px] text-kz-ink-soft">
            Chaque défi réussi te rapproche d'un nouveau badge. Garde le rythme ! 🚀
          </Text>
        </Card>
      </View>
    </Screen>
  );
};
