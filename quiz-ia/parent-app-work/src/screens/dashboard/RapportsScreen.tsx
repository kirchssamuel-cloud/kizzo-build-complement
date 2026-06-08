import * as React from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarChart3, ChevronRight } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { Card } from '~/components/ui/Card';
import { Avatar } from '~/components/ui/Avatar';
import { Text } from '~/components/ui/Text';
import { useEnfants } from '~/hooks/enfants';
import { colors } from '~/theme/colors';
import type { AppStackParamList } from '~/navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export const RapportsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const enfants = useEnfants();

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={enfants.isFetching}
          onRefresh={() => enfants.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <View className="pt-4 pb-2">
        <Text className="font-bold text-[24px] text-kz-ink">Rapports</Text>
        <Text className="mt-1 text-[13px] text-kz-muted">
          Suivi du temps d'écran, défis, alertes — par enfant.
        </Text>
      </View>

      {enfants.data && enfants.data.length > 0 ? (
        <View className="mt-4 gap-3">
          {enfants.data.map((enfant) => (
            <Pressable
              key={enfant.id}
              onPress={() =>
                navigation.navigate('ActivityReport', { childId: enfant.id })
              }
            >
              <Card className="flex-row items-center gap-4 py-4">
                <Avatar
                  prenom={enfant.prenom}
                  couleurTheme={enfant.couleurTheme ?? colors.primary}
                  size={44}
                />
                <View className="flex-1">
                  <Text className="font-bold text-[16px] text-kz-ink">
                    {enfant.prenom}
                  </Text>
                  <Text className="mt-0.5 text-[13px] text-kz-muted">
                    Voir le rapport d'activité
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.muted} />
              </Card>
            </Pressable>
          ))}
        </View>
      ) : (
        <Card className="mt-6 items-center py-10">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-kz-soft">
            <BarChart3 size={26} color={colors.primary} />
          </View>
          <Text className="mt-4 text-center font-bold text-[16px] text-kz-ink">
            Aucun enfant à suivre
          </Text>
          <Text className="mt-1 text-center text-[13px] text-kz-muted">
            Ajoutez un profil enfant pour voir ses rapports d'activité.
          </Text>
        </Card>
      )}
    </Screen>
  );
};
