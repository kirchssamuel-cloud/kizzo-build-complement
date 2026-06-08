import * as React from 'react';
import { cn } from '~/lib/cn';
import { Text } from './Text';

type LabelProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'field' | 'caption';
};

export const Label: React.FC<LabelProps> = ({ children, className, variant = 'field' }) => {
  if (variant === 'caption') {
    return (
      <Text
        className={cn(
          'mb-2 font-medium text-[12px] tracking-[0.14em] text-kz-ink-muted',
          className,
        )}
      >
        {typeof children === 'string' ? children.toUpperCase() : children}
      </Text>
    );
  }
  return (
    <Text className={cn('mb-2 pl-2 font-sans text-[12px] text-kz-ink dark:text-kz-white', className)}>
      {children}
    </Text>
  );
};
