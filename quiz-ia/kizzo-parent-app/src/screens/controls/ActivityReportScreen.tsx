import * as React from 'react';
import { Pressable, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { Award, Clock, Globe, ShieldOff } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useActivityReport } from '~/hooks/controls';
import { colors } from '~/theme/colors';
import type { AppStackParamList } from '~/navigation/types';

type R = RouteProp<AppStackParamList, 'ActivityReport'>;

const formatDuration = (seconds: number) => {
  const total = Math.round(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
  return `${m} min`;
};

const PERIODES = [
  { jours: 1, label: "Aujourd'hui" },
  { jours: 7, label: '7 jours' },
  { jours: 30, label: '30 jours' },
];

export const ActivityReportScreen: React.FC = () => {
  const route = useRoute<R>();
  const childId = route.params.childId;
  const [jours, setJours] = React.useState(7);
  const report = useActivityReport(childId, jours);

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Rapport d'activité" subtitle="Suis les progrès de ton enfant" />

      <View className="px-5 pb-10">
        <View className="mb-5 flex-row gap-2">
          {PERIODES.map((p) => {
            const active = jours === p.jours;
            return (
              <Pressable
                key={p.jours}
                onPress={() => setJours(p.jours)}
                className={`flex-1 items-center rounded-2xl py-2.5 ${active ? 'bg-kz-cyan' : 'bg-kz-surface-soft'}`}
              >
                <Text className={active ? 'text-kz-white' : 'text-kz-ink-soft'}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {report.isLoading ? (
          <Text className="text-kz-ink-muted">Chargement…</Text>
        ) : report.data ? (
          <>
            <View className="flex-row gap-3">
              <Card className="flex-1">
                <Clock size={18} color={colors.cyan} />
                <Text className="mt-3 font-number text-[20px] text-kz-ink">
                  {formatDuration(report.data.ecran.totalSeconds)}
                </Text>
                <Text className="text-[12px] text-kz-ink-muted">Temps d'écran</Text>
              </Card>
              <Card className="flex-1">
                <Award size={18} color={colors.orange} />
                <Text className="mt-3 font-number text-[20px] text-kz-ink">
                  {report.data.quiz.reussis}/{report.data.quiz.total}
                </Text>
                <Text className="text-[12px] text-kz-ink-muted">Quiz réussis</Text>
              </Card>
            </View>

            <View className="mt-3 flex-row gap-3">
              <Card className="flex-1">
                <Globe size={18} color={colors.green} />
                <Text className="mt-3 font-number text-[20px] text-kz-ink">
                  {report.data.web.totalVisites}
                </Text>
                <Text className="text-[12px] text-kz-ink-muted">Visites web</Text>
              </Card>
              <Card className="flex-1">
                <ShieldOff size={18} color={colors.red} />
                <Text className="mt-3 font-number text-[20px] text-kz-ink">
                  {report.data.web.visitesBloquees}
                </Text>
                <Text className="text-[12px] text-kz-ink-muted">Sites bloqués</Text>
              </Card>
            </View>

            <Card className="mt-3">
              <Text className="text-[13px] text-kz-ink-muted">Score moyen aux quiz</Text>
              <Text className="mt-1 font-number text-[22px] text-kz-ink">
                {report.data.quiz.scoreMoyen}/100
              </Text>
              <Text className="mt-1 text-[13px] text-kz-ink-soft">
                Temps gagné : {formatDuration(report.data.quiz.tempsGagneSeconds)}
              </Text>
            </Card>

            {report.data.ecran.apps.length > 0 ? (
              <>
                <Text className="mb-2 mt-6 font-heading-semi text-[15px] text-kz-ink">
                  Apps les plus utilisées
                </Text>
                {report.data.ecran.apps.slice(0, 6).map((a) => (
                  <View
                    key={a.id}
                    className="mb-2 flex-row items-center justify-between rounded-2xl bg-kz-surface-soft px-4 py-3"
                  >
                    <Text className="text-[14px] text-kz-ink">{a.nomApp}</Text>
                    <Text className="font-number text-[14px] text-kz-ink-soft">
                      {formatDuration(a.dureeSeconds)}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
          </>
        ) : (
          <Text className="text-center text-kz-ink-muted">Aucune donnée sur cette période.</Text>
        )}
      </View>
    </Screen>
  );
};
