import * as React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { kizzoOrangeGradient } from '~/theme/colors';
import { cn } from '~/lib/cn';

type LogoProps = {
  size?: number;
  variant?: 'mark' | 'wordmark' | 'inline';
  className?: string;
};

export const LogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 100,
  className,
}) => (
  <View
    className={cn('rounded-3xl', className)}
    style={{
      width: size,
      height: size,
      shadowColor: '#f97316',
      shadowOpacity: 0.3,
      shadowRadius: 40,
      shadowOffset: { width: 0, height: 0 },
    }}
  >
    <LinearGradient
      colors={kizzoOrangeGradient as unknown as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: 24 }}
    />
  </View>
);

export const Logo: React.FC<LogoProps> = ({ size = 100, variant = 'wordmark', className }) => {
  if (variant === 'mark') {
    return <LogoMark size={size} className={className} />;
  }
  if (variant === 'inline') {
    return (
      <View className={cn('flex-row items-center gap-2', className)}>
        <LogoMark size={size} />
        <Text className="font-heading text-[24px] text-kz-ink dark:text-kz-white">KIZZO</Text>
      </View>
    );
  }
  return (
    <View className={cn('items-center', className)}>
      <LogoMark size={size} />
      <View style={{ height: 19 }} />
      <Text className="font-heading text-[30.6px] text-kz-ink dark:text-kz-white">KIZZO</Text>
      <View style={{ height: 19 }} />
      <View className="h-1 w-12 rounded-full bg-kz-cyan" />
    </View>
  );
};
