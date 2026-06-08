import * as React from 'react';
import { View } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, X } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { QuestionRenderer, isAnswered } from '~/components/quiz/QuestionRenderer';
import { useQuiz, useSubmitQuiz } from '~/hooks/quiz';
import type { QuizResult } from '~/services/api/quiz';
import { useAuthStore } from '~/store/auth.store';
import { colors } from '~/theme/colors';
import { cn } from '~/lib/cn';
import type { AppStackParamList } from '~/navigation/types';

type R = RouteProp<AppStackParamList, 'QuizPlay'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'QuizPlay'>;

export const QuizPlayScreen: React.FC = () => {
  const route = useRoute<R>();
  const navigation = useNavigation<Nav>();
  const quiz = useQuiz(route.params.quizId);
  const submit = useSubmitQuiz();
  const profilEnfant = useAuthStore((s) => s.profilEnfant);

  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<QuizResult | null>(null);
  const startedAt = React.useRef(Date.now());

  if (quiz.isLoading || !quiz.data) {
    return (
      <Screen noPadding>
        <SubScreenHeader title="Quiz" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-kz-ink-soft dark:text-kz-white/70">Chargement…</Text>
        </View>
      </Screen>
    );
  }

  const questions = quiz.data.questions;
  const total = questions.length;
  const q = questions[step];

  if (result) {
    return (
      <Screen scroll noPadding>
        <SubScreenHeader title="Résultat" hideBack />
        <View className="flex-1 items-center px-6 pt-10">
          <View
            className={cn(
              'h-24 w-24 items-center justify-center rounded-full',
              result.reussi ? 'bg-kz-green/20' : 'bg-kz-orange/20',
            )}
          >
            {result.reussi ? (
              <Check size={48} color={colors.green} strokeWidth={3} />
            ) : (
              <X size={48} color={colors.orange} strokeWidth={3} />
            )}
          </View>
          <Text className="mt-6 text-center font-heading text-[28px] text-kz-ink dark:text-kz-white">
            {result.reussi ? 'Bravo ! 🎉' : 'Presque !'}
          </Text>
          <Text className="mt-2 text-center text-[15px] text-kz-ink-soft dark:text-kz-white/70">
            Score : <Text className="font-bold text-kz-ink dark:text-kz-white">{result.score}%</Text>{' '}
            ({result.correct}/{result.total})
          </Text>
          {result.reussi ? (
            <Card className="mt-6 w-full items-center py-6">
              <Text className="text-[14px] text-kz-ink-soft dark:text-kz-white/70">
                Temps gagné
              </Text>
              <Text className="mt-1 font-number text-[36px] text-kz-green">
                +{result.tempsCredite} min
              </Text>
            </Card>
          ) : (
            <Text className="mt-4 text-center text-[14px] text-kz-ink-soft dark:text-kz-white/70">
              Pas de panique, tu peux réessayer un nouveau quiz !
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

  const onChange = (value: string) => setAnswers((a) => ({ ...a, [q.id]: value }));
  const canNext = isAnswered(q, answers[q.id] ?? '');

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
      quizId: quiz.data.id,
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
      <SubScreenHeader title={quiz.data.titre} />
      <View className="px-6 pb-10">
        <Text className="text-[12px] font-semibold uppercase tracking-wider text-kz-cyan">
          Question {step + 1} sur {total}
        </Text>
        <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-kz-ink/10 dark:bg-white/10">
          <View
            className="h-full rounded-full bg-kz-cyan"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </View>

        <Text className="mt-6 font-heading-semi text-[20px] leading-[28px] text-kz-ink dark:text-kz-white">
          {q.enonce}
        </Text>

        <View className="mt-6">
          <QuestionRenderer question={q} value={answers[q.id] ?? ''} onChange={onChange} />
        </View>

        <Button className="mt-8" onPress={onNext} disabled={!canNext} loading={submit.isPending}>
          {step < total - 1 ? 'Question suivante' : 'Voir le résultat'}
        </Button>
      </View>
    </Screen>
  );
};
