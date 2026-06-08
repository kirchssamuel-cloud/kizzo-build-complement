import * as React from 'react';
import { Pressable, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Clock, Minus, Moon, Plus } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Checkbox } from '~/components/ui/Checkbox';
import { Input } from '~/components/ui/Input';
import { Text } from '~/components/ui/Text';
import {
  useScreenTimeRules,
  useScreenTimeUsage,
  useUpsertScreenTimeRule,
} from '~/hooks/controls';
import { colors } from '~/theme/colors';
import type { JourSemaine } from '~/types/controls';
import type { AppStackParamList } from '~/navigation/types';

type R = RouteProp<AppStackParamList, 'ScreenTime'>;

const JOURS: { value: JourSemaine; court: string }[] = [
  { value: 'lundi', court: 'Lun' },
  { value: 'mardi', court: 'Mar' },
  { value: 'mercredi', court: 'Mer' },
  { value: 'jeudi', court: 'Jeu' },
  { value: 'vendredi', court: 'Ven' },
  { value: 'samedi', court: 'Sam' },
  { value: 'dimanche', court: 'Dim' },
];

const HEURE_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

type Plage = { minutesMatin: number; minutesApresMidi: number; minutesSoir: number };

const DEFAUT = {
  minutesMatin: 30,
  minutesApresMidi: 60,
  minutesSoir: 30,
  modeNuitActif: true,
  modeNuitDebut: '21:00',
  modeNuitFin: '07:00',
};

const StepperLigne: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
}> = ({ label, value, onChange, max }) => (
  <View className="mt-3 flex-row items-center justify-between">
    <Text className="text-[15px] text-kz-ink">{label}</Text>
    <View className="flex-row items-center gap-3">
      <Button
        size="icon"
        variant="outline-blue"
        onPress={() => onChange(Math.max(0, value - 15))}
        disabled={value <= 0}
      >
        <Minus size={18} color={colors.ink} />
      </Button>
      <Text className="w-[64px] text-center font-heading-semi text-[15px] text-kz-ink">
        {value} min
      </Text>
      <Button
        size="icon"
        variant="outline-blue"
        onPress={() => onChange(Math.min(max, value + 15))}
        disabled={value >= max}
      >
        <Plus size={18} color={colors.ink} />
      </Button>
    </View>
  </View>
);

export const ScreenTimeScreen: React.FC = () => {
  const route = useRoute<R>();
  const childId = route.params.childId;
  const rules = useScreenTimeRules(childId);
  const usage = useScreenTimeUsage(childId);
  const upsert = useUpsertScreenTimeRule(childId);

  const [jour, setJour] = React.useState<JourSemaine>('lundi');
  const [plage, setPlage] = React.useState<Plage>({
    minutesMatin: DEFAUT.minutesMatin,
    minutesApresMidi: DEFAUT.minutesApresMidi,
    minutesSoir: DEFAUT.minutesSoir,
  });
  const [modeNuitActif, setModeNuitActif] = React.useState(DEFAUT.modeNuitActif);
  const [debut, setDebut] = React.useState(DEFAUT.modeNuitDebut);
  const [fin, setFin] = React.useState(DEFAUT.modeNuitFin);

  // Charge la règle du jour sélectionné (ou valeurs par défaut si absente).
  React.useEffect(() => {
    const regle = rules.data?.find((r) => r.jourSemaine === jour);
    if (regle) {
      setPlage({
        minutesMatin: regle.minutesMatin,
        minutesApresMidi: regle.minutesApresMidi,
        minutesSoir: regle.minutesSoir,
      });
      setModeNuitActif(regle.modeNuitActif);
      setDebut(regle.modeNuitDebut);
      setFin(regle.modeNuitFin);
    } else {
      setPlage({
        minutesMatin: DEFAUT.minutesMatin,
        minutesApresMidi: DEFAUT.minutesApresMidi,
        minutesSoir: DEFAUT.minutesSoir,
      });
      setModeNuitActif(DEFAUT.modeNuitActif);
      setDebut(DEFAUT.modeNuitDebut);
      setFin(DEFAUT.modeNuitFin);
    }
  }, [jour, rules.data]);

  const totalJour = plage.minutesMatin + plage.minutesApresMidi + plage.minutesSoir;
  const heuresUtilisees = usage.data ? Math.round(usage.data.totalSeconds / 60) : null;
  const heuresInvalides = !HEURE_REGEX.test(debut) || !HEURE_REGEX.test(fin);

  const save = () => {
    if (modeNuitActif && heuresInvalides) {
      Toast.show({ type: 'error', text1: 'Heures invalides (format HH:mm)' });
      return;
    }
    upsert.mutate(
      {
        jourSemaine: jour,
        minutesMatin: plage.minutesMatin,
        minutesApresMidi: plage.minutesApresMidi,
        minutesSoir: plage.minutesSoir,
        modeNuitActif,
        modeNuitDebut: debut,
        modeNuitFin: fin,
      },
      {
        onSuccess: () =>
          Toast.show({ type: 'success', text1: `Horaires du ${jour} enregistrés` }),
        onError: () => Toast.show({ type: 'error', text1: "Échec de l'enregistrement" }),
      },
    );
  };

  return (
    <Screen scroll noPadding>
      <SubScreenHeader
        title="Horaires & quota"
        subtitle="Définis le temps d'écran autorisé par jour"
      />

      <View className="px-5 pb-10">
        {heuresUtilisees !== null && (
          <Card className="flex-row items-center">
            <Clock size={20} color={colors.cyan} />
            <Text className="ml-3 flex-1 text-[14px] text-kz-ink">
              Aujourd'hui : {heuresUtilisees} min utilisées
            </Text>
          </Card>
        )}

        <Text className="mb-2 mt-6 font-heading-semi text-[15px] text-kz-ink">Jour</Text>
        <View className="flex-row flex-wrap gap-2">
          {JOURS.map((j) => {
            const active = jour === j.value;
            return (
              <Pressable
                key={j.value}
                onPress={() => setJour(j.value)}
                className={`rounded-full px-4 py-2 ${active ? 'bg-kz-cyan' : 'bg-kz-surface-soft'}`}
              >
                <Text
                  className={`text-[13px] ${active ? 'font-heading-semi text-white' : 'text-kz-ink'}`}
                >
                  {j.court}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Card className="mt-6">
          <Text className="font-heading-semi text-[15px] text-kz-ink">
            Quota par plage horaire
          </Text>
          <StepperLigne
            label="Matin"
            value={plage.minutesMatin}
            max={360}
            onChange={(v) => setPlage((p) => ({ ...p, minutesMatin: v }))}
          />
          <StepperLigne
            label="Après-midi"
            value={plage.minutesApresMidi}
            max={360}
            onChange={(v) => setPlage((p) => ({ ...p, minutesApresMidi: v }))}
          />
          <StepperLigne
            label="Soir"
            value={plage.minutesSoir}
            max={240}
            onChange={(v) => setPlage((p) => ({ ...p, minutesSoir: v }))}
          />
          <View className="mt-4 border-t border-kz-stroke pt-3">
            <Text className="text-right text-[13px] text-kz-ink-muted">
              Total : {totalJour} min / jour
            </Text>
          </View>
        </Card>

        <Card className="mt-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center">
              <Moon size={20} color={colors.cyan} />
              <View className="ml-3 flex-1">
                <Text className="font-heading-semi text-[15px] text-kz-ink">Mode nuit</Text>
                <Text className="text-[13px] text-kz-ink-muted">
                  Bloque l'appareil pendant la nuit
                </Text>
              </View>
            </View>
            <Checkbox checked={modeNuitActif} onCheckedChange={setModeNuitActif} />
          </View>

          {modeNuitActif && (
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1 text-[13px] text-kz-ink-muted">Début</Text>
                <Input
                  placeholder="21:00"
                  value={debut}
                  onChangeText={setDebut}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-[13px] text-kz-ink-muted">Fin</Text>
                <Input
                  placeholder="07:00"
                  value={fin}
                  onChangeText={setFin}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          )}
        </Card>

        <Button className="mt-8" loading={upsert.isPending} onPress={save}>
          Enregistrer ce jour
        </Button>
      </View>
    </Screen>
  );
};
