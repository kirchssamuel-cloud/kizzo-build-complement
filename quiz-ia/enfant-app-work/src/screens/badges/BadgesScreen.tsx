import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Award, Lock } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { colors } from '~/theme/colors';
import { useBadges } from '~/hooks/badges';

export const BadgesScreen: React.FC = () => {
  const { data, isLoading, isError } = useBadges();

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Mes badges" />
      <View className="px-5 pt-4 pb-10">
        <Text className="font-bold text-[24px] text-kz-ink">Tes récompenses 🏆</Text>
        <Text className="mt-1 text-[13px] text-kz-muted">
          {data
            ? `${data.nombreAcquis} badge${data.nombreAcquis > 1 ? 's' : ''} sur ${data.total} débloqué${
                data.nombreAcquis > 1 ? 's' : ''
              }.`
            : 'Continue de relever des défis pour débloquer plus de badges.'}
        </Text>

        {isLoading && (
          <View className="mt-10 items-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {isError && (
          <Card className="mt-6 py-5">
            <Text className="text-center text-[13px] text-kz-muted">
              Impossible de charger tes badges pour le moment.
            </Text>
          </Card>
        )}

        {data && (
          <View className="mt-6 flex-row flex-wrap gap-3">
            {data.badges.map((b) => (
              <Card
                key={b.type}
                className="w-[47%] items-center py-5"
                style={{ opacity: b.acquis ? 1 : 0.5 }}
              >
                <View className="h-14 w-14 items-center justify-center rounded-full bg-kz-soft">
                  {b.acquis ? (
                    <Award size={26} color={colors.warning} />
                  ) : (
                    <Lock size={22} color={colors.muted} />
                  )}
                </View>
                <Text className="mt-3 text-center font-bold text-[13px] text-kz-ink">
                  {b.titre}
                </Text>
                <Text className="mt-1 px-2 text-center text-[11px] text-kz-muted">
                  {b.description}
                </Text>
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
};
