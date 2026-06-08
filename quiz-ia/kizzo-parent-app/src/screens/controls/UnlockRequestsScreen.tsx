import * as React from 'react';
import { View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Check, Clock, X } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useRespondUnlockRequest, useUnlockRequests } from '~/hooks/controls';
import { colors } from '~/theme/colors';
import type { DemandeTemps } from '~/types/controls';
import type { AppStackParamList } from '~/navigation/types';

type R = RouteProp<AppStackParamList, 'UnlockRequests'>;

export const UnlockRequestsScreen: React.FC = () => {
  const route = useRoute<R>();
  const childId = route.params?.childId;
  const demandes = useUnlockRequests('en_attente', childId);
  const respond = useRespondUnlockRequest();

  const handle = (demande: DemandeTemps, accepter: boolean) => {
    respond.mutate(
      { demandeId: demande.id, input: { accepter } },
      {
        onSuccess: () =>
          Toast.show({
            type: 'success',
            text1: accepter
              ? `+${demande.minutes} min accordées`
              : 'Demande refusée',
          }),
        onError: () => Toast.show({ type: 'error', text1: 'Action impossible' }),
      },
    );
  };

  return (
    <Screen scroll noPadding>
      <SubScreenHeader
        title="Demandes de temps"
        subtitle="Réponds aux demandes de tes enfants"
      />

      <View className="px-5 pb-10">
        {demandes.isLoading ? (
          <Text className="text-kz-ink-muted">Chargement…</Text>
        ) : demandes.data && demandes.data.length > 0 ? (
          demandes.data.map((d) => (
            <Card key={d.id} className="mb-3">
              <View className="mb-2 flex-row items-center">
                <Clock size={18} color={colors.orange} />
                <Text className="ml-2 font-heading-semi text-[16px] text-kz-ink">
                  {d.profilEnfant?.prenom ?? 'Enfant'} · {d.minutes} min
                </Text>
              </View>
              {d.message ? (
                <Text className="mb-3 text-[14px] text-kz-ink-soft">« {d.message} »</Text>
              ) : null}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={respond.isPending}
                    onPress={() => handle(d, false)}
                    leftIcon={<X size={18} color={colors.red} />}
                  >
                    Refuser
                  </Button>
                </View>
                <View className="flex-1">
                  <Button
                    size="sm"
                    loading={respond.isPending}
                    onPress={() => handle(d, true)}
                    leftIcon={<Check size={18} color={colors.white} />}
                  >
                    Accorder
                  </Button>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Text className="text-center text-kz-ink-muted">
            Aucune demande en attente.
          </Text>
        )}
      </View>
    </Screen>
  );
};
