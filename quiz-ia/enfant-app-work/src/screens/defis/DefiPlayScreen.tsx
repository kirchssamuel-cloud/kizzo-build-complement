import * as React from 'react';
import { Pressable, View } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, X } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Input } from '~/components/ui/Input';
import { Text } from '~/components/ui/Text';
import { useDefi, useSubmitDefi } from '~/hooks/defis';
import { useAuthStore } from '~/store/auth.store';
import { cn } from '~/lib/cn';
import { colors } from '~/theme/colors';
import type { AppStackParamList } from '~/navigation/types';

type R = RouteProp<AppStackParamList, 'DefiPlay'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'DefiPlay'>;

export const DefiPlayScreen: React.FC = () => {
  const route = useRoute<R>();
  const navigation = useNavigation<Nav>();
  const defi = useDefi(route.params.id);
  const submit = useSubmitDefi();
  const profilEnfant = useAuthStore((s) => s.profilEnfant);

  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<{
    score: number;
    reussi: boolean;
    tempsCredite: number;
  } | null>(null);
  const startedAt = React.useRef(Date.now());

  if (!defi.data) {
    return (
      <Screen noPadding>
        <SubScreenHeader title="Défi" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-kz-muted">Chargement…</Text>
        </View>
      </Screen>
    );
  }

  const questions = defi.data.questions;
  const total = questions.length;
  const q = questions[step];

  if (result) {
    return (
      <Screen scroll noPadding>
        <SubScreenHeader title="Résultat" />
        <View className="flex-1 items-center px-5 pt-10">
          <View
            className={cn(
              'h-24 w-24 items-center justify-center rounded-full',
              result.reussi ? 'bg-kz-success/20' : 'bg-kz-warning/20',
            )}
          >
            {result.reussi ? (
              <Check size={48} color={colors.success} strokeWidth={3} />
            ) : (
              <X size={48} color={colors.warning} strokeWidth={3} />
            )}
          </View>
          <Text className="mt-6 text-center font-black text-[28px] text-kz-ink">
            {result.reussi ? 'Bravo !' : 'Presque !'}
          </Text>
          <Text className="mt-2 text-center text-[15px] text-kz-muted">
            Score : <Text className="font-bold text-kz-ink">{result.score}%</Text>
          </Text>
          {result.reussi ? (
            <Card className="mt-6 w-full items-center py-6">
              <Text className="text-[14px] text-kz-muted">Temps gagné</Text>
              <Text className="mt-1 font-black text-[36px] text-kz-success">
                +{result.tempsCredite} min
              </Text>
            </Card>
          ) : (
            <Text className="mt-4 text-center text-[14px] text-kz-muted">
              Pas de panique, tu peux réessayer demain !
            </Text>
          )}
          <Button className="mt-8 w-full" onPress={() => navigation.popToTop()}>
            Continuer
          </Button>
        </View>
      </Screen>
    );
  }

  if (!q) return null;

  const onAnswer = (value: string) => setAnswers((a) => ({ ...a, [q.id]: value }));

  const onNext = async () => {
    if (step < total - 1) {
      setStep((s) => s + 1);
      return;
    }
    if (!profilEnfant) return;
    const reponses = questions.map((qq) => ({
      questionId: qq.id,
      reponse: answers[qq.id] ?? '',
    }));
    const data = await submit.mutateAsync({
      id: defi.data.id,
      payload: {
        profilEnfantId: profilEnfant.id,
        reponses,
        dureeSeconds: Math.round((Date.now() - startedAt.current) / 1000),
      },
    });
    setResult(data);
  };

  return (
    <Screen noPadding scroll>
      <SubScreenHeader title={defi.data.titre} />
      <View className="px-5 pt-4 pb-10">
        <Text className="text-[12px] font-semibold uppercase tracking-wider text-kz-muted">
          Question {step + 1} sur {total}
        </Text>
        <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-kz-stroke">
          <View
            className="h-full bg-kz-primary"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </View>

        <Text className="mt-6 font-bold text-[20px] leading-[28px] text-kz-ink">
          {q.enonce}
        </Text>

        <View className="mt-6 gap-2.5">
          {q.options && q.options.length > 0 ? (
            q.options.map((opt) => {
              const active = answers[q.id] === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => onAnswer(opt)}
                  className={cn(
                    'rounded-2xl border-2 bg-kz-card px-5 py-4',
                    active ? 'border-kz-primary' : 'border-kz-stroke',
                  )}
                >
                  <Text
                    className={cn(
                      'text-[15px]',
                      active ? 'font-bold text-kz-primary' : 'text-kz-ink',
                    )}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <Input
              value={answers[q.id] ?? ''}
              onChangeText={onAnswer}
              placeholder="Ta réponse"
              keyboardType={q.type === 'calcul' ? 'numeric' : 'default'}
            />
          )}
        </View>

        <Button
          className="mt-8"
          onPress={onNext}
          disabled={!answers[q.id]}
          loading={submit.isPending}
        >
          {step < total - 1 ? 'Question suivante' : 'Voir le résultat'}
        </Button>
      </View>
    </Screen>
  );
};
