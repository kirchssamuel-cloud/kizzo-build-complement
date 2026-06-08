import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, Plus } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { Avatar } from '~/components/ui/Avatar';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useEnfants } from '~/hooks/enfants';
import type { AppStackParamList } from '~/navigation/types';
import { colors } from '~/theme/colors';

type Nav = NativeStackNavigationProp<AppStackParamList>;

const niveauLabel: Record<string, string> = {
  maternelle: 'Maternelle',
  cp: 'CP',
  ce1: 'CE1',
  ce2: 'CE2',
  cm1: 'CM1',
  cm2: 'CM2',
  sixieme: '6e',
  cinquieme: '5e',
  quatrieme: '4e',
  troisieme: '3e',
  seconde: 'Seconde',
  premiere: 'Première',
  terminale: 'Terminale',
};

export const EnfantsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const enfants = useEnfants();

  return (
    <Screen scroll>
      <View className="pt-4 pb-2">
        <Text className="font-bold text-[24px] text-kz-ink">Mes enfants</Text>
        <Text className="mt-1 text-[13px] text-kz-muted">
          Jusqu'à 6 profils par compte parent.
        </Text>
      </View>

      <View className="mt-4 gap-3">
        {enfants.data?.map((enfant) => (
          <Pressable
            key={enfant.id}
            onPress={() => navigation.navigate('EnfantDetail', { id: enfant.id })}
          >
            <Card className="flex-row items-center">
              <Avatar prenom={enfant.prenom} couleurTheme={enfant.couleurTheme} size={48} />
              <View className="ml-3 flex-1">
                <Text className="font-bold text-[15px] text-kz-ink">{enfant.prenom}</Text>
                <Text className="text-[12px] text-kz-muted">
                  {niveauLabel[enfant.niveauScolaire] ?? enfant.niveauScolaire}
                  {enfant.age ? ` · ${enfant.age} ans` : ''}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </Card>
          </Pressable>
        ))}

        <Pressable onPress={() => navigation.navigate('AjoutEnfant')}>
          <Card className="flex-row items-center justify-center gap-2 border border-dashed border-kz-stroke bg-transparent shadow-none">
            <Plus size={18} color={colors.primary} />
            <Text className="font-semibold text-[14px] text-kz-primary">Ajouter un profil</Text>
          </Card>
        </Pressable>
      </View>
    </Screen>
  );
};
