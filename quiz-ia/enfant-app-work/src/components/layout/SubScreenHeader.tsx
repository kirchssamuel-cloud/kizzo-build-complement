import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { cn } from '~/lib/cn';
import { Text } from '../ui/Text';
import { useTheme } from '~/theme/theme-provider';

type SubScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  hideBack?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
};

export const SubScreenHeader: React.FC<SubScreenHeaderProps> = ({
  title,
  subtitle,
  hideBack,
  rightSlot,
  className,
}) => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  return (
    <View className={cn('pt-2 pb-6', className)}>
      <View className="flex-row items-center justify-between">
        {hideBack ? (
          <View className="w-10" />
        ) : (
          <Pressable
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            accessibilityLabel="Retour"
            accessibilityRole="button"
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full',
              isDark ? 'bg-kz-surface-soft' : 'bg-white shadow-cyan-soft',
            )}
            hitSlop={6}
          >
            <ArrowLeft size={20} color={isDark ? '#fafafa' : '#1e293b'} strokeWidth={2.2} />
          </Pressable>
        )}
        {rightSlot ?? <View className="w-10" />}
      </View>
      {title ? (
        <View className="mt-6">
          <Text className="font-heading text-[28px] text-kz-ink dark:text-kz-white">{title}</Text>
          {subtitle ? (
            <Text className="mt-2 text-[14px] text-kz-ink-soft">{subtitle}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};
