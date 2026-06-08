import * as React from 'react';
import { Pressable, View } from 'react-native';
import { GripVertical } from 'lucide-react-native';
import { Input } from '~/components/ui/Input';
import { Text } from '~/components/ui/Text';
import { cn } from '~/lib/cn';
import { colors } from '~/theme/colors';
import type { QuizOption, QuizPair, QuizQuestion } from '~/services/api/quiz';

/**
 * Rend une question quiz selon son type et expose la réponse sous forme de
 * chaîne (contrat backend `reponses[].reponse`) :
 *  - qcm / vrai_faux : `value` de l'option choisie ;
 *  - texte / calcul  : texte libre ;
 *  - tri             : JSON d'un tableau ordonné de valeurs ;
 *  - association     : JSON d'un tableau de `right` dans l'ordre des `left`.
 */
type Props = {
  question: QuizQuestion;
  value: string;
  onChange: (value: string) => void;
};

const OptionButton: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  badge?: string;
}> = ({ label, active, onPress, badge }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    className={cn(
      'flex-row items-center rounded-2xl border-2 px-5 py-4',
      active
        ? 'border-kz-cyan bg-kz-cyan/10 shadow-cyan-soft'
        : 'border-kz-stroke bg-kz-surface/40',
    )}
  >
    {badge ? (
      <View className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-kz-cyan">
        <Text className="font-bold text-[13px] text-white">{badge}</Text>
      </View>
    ) : null}
    <Text
      className={cn(
        'flex-1 text-[15px]',
        active ? 'font-bold text-kz-cyan' : 'text-kz-ink dark:text-kz-white',
      )}
    >
      {label}
    </Text>
  </Pressable>
);

const ChoiceQuestion: React.FC<Props> = ({ question, value, onChange }) => {
  const options = (question.options ?? []) as QuizOption[];
  return (
    <View className="gap-2.5">
      {options.map((opt) => (
        <OptionButton
          key={opt.value}
          label={opt.label}
          active={value === opt.value}
          onPress={() => onChange(opt.value)}
        />
      ))}
    </View>
  );
};

const TextQuestion: React.FC<Props & { numeric?: boolean }> = ({
  value,
  onChange,
  numeric,
}) => (
  <Input
    value={value}
    onChangeText={onChange}
    placeholder="Ta réponse"
    keyboardType={numeric ? 'numeric' : 'default'}
    autoCapitalize="none"
  />
);

/** SORT : l'enfant tape les items dans l'ordre voulu (sélection numérotée). */
const SortQuestion: React.FC<Props> = ({ question, value, onChange }) => {
  const items = ((question.options as { items: string[] } | null)?.items ?? []) as string[];
  const order: string[] = React.useMemo(() => {
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [value]);

  const toggle = (item: string) => {
    const next = order.includes(item)
      ? order.filter((x) => x !== item)
      : [...order, item];
    onChange(JSON.stringify(next));
  };

  return (
    <View className="gap-2.5">
      <Text className="text-[13px] text-kz-ink-soft dark:text-kz-white/70">
        Touche les éléments dans le bon ordre.
      </Text>
      {items.map((item) => {
        const rank = order.indexOf(item);
        const active = rank >= 0;
        return (
          <Pressable
            key={item}
            onPress={() => toggle(item)}
            accessibilityRole="button"
            className={cn(
              'flex-row items-center rounded-2xl border-2 px-4 py-4',
              active
                ? 'border-kz-cyan bg-kz-cyan/10 shadow-cyan-soft'
                : 'border-kz-stroke bg-kz-surface/40',
            )}
          >
            <View
              className={cn(
                'mr-3 h-7 w-7 items-center justify-center rounded-full',
                active ? 'bg-kz-cyan' : 'bg-kz-ink/10 dark:bg-white/10',
              )}
            >
              {active ? (
                <Text className="font-bold text-[13px] text-white">{rank + 1}</Text>
              ) : (
                <GripVertical size={14} color={colors.muted} />
              )}
            </View>
            <Text className="flex-1 text-[15px] text-kz-ink dark:text-kz-white">{item}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

/** MATCH : pour chaque `left`, l'enfant choisit le `right` correspondant. */
const MatchQuestion: React.FC<Props> = ({ question, value, onChange }) => {
  const pairs = ((question.options as { pairs: QuizPair[] } | null)?.pairs ?? []) as QuizPair[];
  const lefts = pairs.map((p) => p.left);
  const rights = React.useMemo(() => {
    // Les `right` sont mélangés une seule fois par question (ordre stable).
    return [...pairs.map((p) => p.right)].sort(() => 0.5 - Math.random());
  }, [pairs]);

  const answers: string[] = React.useMemo(() => {
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [value]);

  const setAnswer = (leftIndex: number, right: string) => {
    const next = [...answers];
    while (next.length < lefts.length) next.push('');
    next[leftIndex] = next[leftIndex] === right ? '' : right;
    onChange(JSON.stringify(next));
  };

  return (
    <View className="gap-4">
      {lefts.map((left, i) => (
        <View key={left} className="gap-2">
          <Text className="font-bold text-[15px] text-kz-ink dark:text-kz-white">{left}</Text>
          <View className="flex-row flex-wrap gap-2">
            {rights.map((right) => {
              const active = answers[i] === right;
              return (
                <Pressable
                  key={right}
                  onPress={() => setAnswer(i, right)}
                  accessibilityRole="button"
                  className={cn(
                    'rounded-full border-2 px-4 py-2',
                    active
                      ? 'border-kz-cyan bg-kz-cyan/10'
                      : 'border-kz-stroke bg-kz-surface/40',
                  )}
                >
                  <Text
                    className={cn(
                      'text-[14px]',
                      active ? 'font-bold text-kz-cyan' : 'text-kz-ink dark:text-kz-white',
                    )}
                  >
                    {right}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

export const QuestionRenderer: React.FC<Props> = (props) => {
  switch (props.question.type) {
    case 'qcm':
    case 'vrai_faux':
      return <ChoiceQuestion {...props} />;
    case 'calcul':
      return <TextQuestion {...props} numeric />;
    case 'tri':
      return <SortQuestion {...props} />;
    case 'association':
      return <MatchQuestion {...props} />;
    case 'texte':
    default:
      return <TextQuestion {...props} />;
  }
};

/** Une réponse est-elle complète (non vide) pour ce type de question ? */
export function isAnswered(question: QuizQuestion, value: string): boolean {
  if (!value) return false;
  if (question.type === 'tri') {
    const items = ((question.options as { items: string[] } | null)?.items ?? []) as string[];
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) && arr.length === items.length;
    } catch {
      return false;
    }
  }
  if (question.type === 'association') {
    const pairs = ((question.options as { pairs: QuizPair[] } | null)?.pairs ?? []) as QuizPair[];
    try {
      const arr = JSON.parse(value);
      return (
        Array.isArray(arr) &&
        arr.length === pairs.length &&
        arr.every((x: string) => typeof x === 'string' && x.length > 0)
      );
    } catch {
      return false;
    }
  }
  return value.trim().length > 0;
}
