import * as React from 'react';
import { View } from 'react-native';
import { cn } from '~/lib/cn';
import { Text } from './Text';

export const Divider: React.FC<{ className?: string }> = ({ className }) => (
  <View className={cn('h-px w-full bg-kz-stroke', className)} />
);

export const OrDivider: React.FC<{ label?: string; className?: string }> = ({
  label = 'ou',
  className,
}) => (
  <View className={cn('flex-row items-center', className)}>
    <View className="h-px flex-1 bg-kz-stroke" />
    <Text className="mx-3 font-medium text-[12px] text-kz-ink-muted">{label}</Text>
    <View className="h-px flex-1 bg-kz-stroke" />
  </View>
);
