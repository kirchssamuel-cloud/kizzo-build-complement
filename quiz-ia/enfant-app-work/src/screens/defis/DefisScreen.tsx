import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, Star, Target } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useDefis } from '~/hooks/defis';
import { colors } from '~/theme/colors';
import type { AppStackParamList } from '~/navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Defis'>;

const matiereLabel: Record<string, string> = {
  maths: 'Maths',
  francais: 'Français',
  histoire_geo: 'Histoire-Géo',
  sciences: 'Sciences',
  anglais: 'Anglais',
  autres: 'Autres',
};

export const DefisScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const defis = useDefis();

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Défis du jour" />
      <View className="px-5 pt-4 pb-10">
        <Text className="font-bold text-[24px] text-kz-ink">Gagne du temps d'écran 🚀</Text>
        <Text className="mt-1 text-[13px] text-kz-muted">
          Réussis un défi pour ajouter des minutes à ton compteur.
        </Text>

        <View className="mt-6 gap-3">
          {defis.isLoading ? (
            <Text className="text-kz-muted">Chargement…</Text>
          ) : defis.data && defis.data.length > 0 ? (
            defis.data.map((d) => (
              <Pressable key={d.id} onPress={() => navigation.navigate('DefiPlay', { id: d.id })}>
                <Card className="flex-row items-center">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-kz-soft">
                    <Target size={22} color={colors.primary} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-[15px] text-kz-ink">{d.titre}</Text>
                    <View className="mt-1 flex-row items-center gap-3">
                      <Text className="text-[12px] text-kz-muted">
                        {matiereLabel[d.matiere] ?? d.matiere}
                      </Text>
                      <View className="flex-row items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            color={i < d.difficulte ? colors.warning : colors.stroke}
                            fill={i < d.difficulte ? colors.warning : 'transparent'}
                          />
                        ))}
                      </View>
                      <View className="rounded-full bg-kz-soft px-2 py-0.5">
                        <Text className="text-[11px] font-semibold text-kz-primary">
                          +{d.tempsRecompense} min
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.muted} />
                </Card>
              </Pressable>
            ))
          ) : (
            <Card className="items-center py-8">
              <Text className="text-center text-[14px] text-kz-muted">
                Aucun défi disponible aujourd'hui. Reviens plus tard !
              </Text>
            </Card>
          )}
        </View>
      </View>
    </Screen>
  );
};
