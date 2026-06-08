import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '~/lib/cn';
import { useTheme } from '~/theme/theme-provider';

export const Card: React.FC<ViewProps & { className?: string }> = ({
  className,
  children,
  ...props
}) => {
  const { isDark } = useTheme();
  return (
    <View
      className={cn(
        'rounded-3xl border p-5 shadow-cyan-soft',
        isDark ? 'bg-kz-surface/40 border-kz-cyan/15' : 'bg-kz-surface border-kz-cyan/30',
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
};
