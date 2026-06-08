import * as React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { cn } from '~/lib/cn';
import { useTheme } from '~/theme/theme-provider';

type IconButtonProps = PressableProps & {
  variant?: 'default' | 'soft' | 'ghost';
  className?: string;
};

export const IconButton = React.forwardRef<any, IconButtonProps>(
  ({ variant = 'soft', className, children, ...props }, ref) => {
    const { isDark } = useTheme();
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        className={cn(
          'h-10 w-10 items-center justify-center rounded-full',
          variant === 'soft' && (isDark ? 'bg-kz-surface-soft' : 'bg-white shadow-cyan-soft'),
          variant === 'ghost' && 'bg-transparent',
          variant === 'default' && 'bg-kz-cyan shadow-cyan-soft',
          className,
        )}
        {...props}
      >
        {children}
      </Pressable>
    );
  },
);
IconButton.displayName = 'IconButton';
