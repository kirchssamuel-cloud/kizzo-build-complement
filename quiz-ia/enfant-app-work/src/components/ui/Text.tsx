import * as React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { cn } from '~/lib/cn';

export const Text = React.forwardRef<RNText, TextProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn('font-sans text-[16px] text-kz-ink dark:text-kz-white', className)}
      {...props}
    />
  ),
);
Text.displayName = 'Text';
