import * as React from 'react';
import { View } from 'react-native';
import { cn } from '~/lib/cn';
import { Text } from './Text';

const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'] as const;

const segmentColor = (idx: number, score: number) => {
  if (idx >= score) return 'bg-white/10';
  if (score === 1) return 'bg-kz-red';
  if (score === 2) return 'bg-kz-orange';
  if (score === 3) return 'bg-kz-cyan';
  return 'bg-kz-green';
};

export const PasswordStrengthBar: React.FC<{ score: 0 | 1 | 2 | 3 | 4; className?: string }> = ({
  score,
  className,
}) => (
  <View className={cn('flex-row items-center', className)}>
    <View className="flex-1 flex-row gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <View key={i} className={cn('h-1.5 flex-1 rounded-full', segmentColor(i, score))} />
      ))}
    </View>
    {score > 0 ? (
      <Text
        className={cn(
          'ml-3 font-semibold text-[11px] tracking-wider',
          score >= 4 ? 'text-kz-green' : score >= 2 ? 'text-kz-orange' : 'text-kz-red',
        )}
      >
        {labels[score]?.toUpperCase()}
      </Text>
    ) : null}
  </View>
);
