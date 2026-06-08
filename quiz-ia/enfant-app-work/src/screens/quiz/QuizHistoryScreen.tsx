import * as React from 'react';
import { View } from 'react-native';
import dayjs from 'dayjs';
import { Check, X } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useQuizHistory } from '~/hooks/quiz';
import { useAuthStore } from '~/store/auth.store';
import { cn } from '~/lib/cn';
import { colors } from '~/theme/colors';

const matiereLabel: Record<string, string> = {
  maths: 'Maths',
  francais: 'Français',
  histoire_geo: 'Histoire-Géo',
  sciences: 'Sciences',
  anglais: 'Anglais',
  autres: 'Autres',
};

export const QuizHistoryScreen: React.FC = () => {
  const profilEnfant = useAuthStore((s) => s.profilEnfant);
  const history = useQuizHistory(profilEnfant?.id);

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Mes quiz" subtitle="Tout ce que tu as déjà tenté." />
      <View className="px-6 pb-10">
        {history.isLoading ? (
          <Text className="text-kz-ink-soft dark:text-kz-white/70">Chargement…</Text>
        ) : history.data && history.data.length > 0 ? (
          <View className="gap-3">
            {history.data.map((t) => (
              <Card key={t.id} className="flex-row items-center">
                <View
                  className={cn(
                    'h-11 w-11 items-center justify-center rounded-2xl',
                    t.reussi ? 'bg-kz-green/15' : 'bg-kz-orange/15',
                  )}
                >
                  {t.reussi ? (
                    <Check size={20} color={colors.green} strokeWidth={2.5} />
                  ) : (
                    <X size={20} color={colors.orange} strokeWidth={2.5} />
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-bold text-[15px] text-kz-ink dark:text-kz-white">
                    {t.titre}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-3">
                    <Text className="text-[12px] text-kz-ink-soft dark:text-kz-white/70">
                      {matiereLabel[t.matiere] ?? t.matiere}
                    </Text>
                    <Text className="text-[12px] text-kz-ink-soft dark:text-kz-white/70">
                      {dayjs(t.date).format('DD/MM')}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text
                    className={cn(
                      'font-number text-[18px]',
                      t.reussi ? 'text-kz-green' : 'text-kz-orange',
                    )}
                  >
                    {t.score}%
                  </Text>
                  {t.tempsCredite > 0 ? (
                    <Text className="text-[11px] font-semibold text-kz-cyan">
                      +{t.tempsCredite} min
                    </Text>
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card className="items-center py-8">
            <Text className="text-center text-[14px] text-kz-ink-soft dark:text-kz-white/70">
              Tu n'as pas encore fait de quiz. Lance ton premier défi !
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
};
