import * as React from 'react';
import { LinearGradient as ExpoLinearGradient, type LinearGradientProps } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import { kizzoGradient } from '~/theme/colors';

const LinearGradient = cssInterop(ExpoLinearGradient, { className: 'style' });

type GradientViewProps = Omit<LinearGradientProps, 'colors' | 'start' | 'end'> & {
  className?: string;
  colors?: LinearGradientProps['colors'];
  direction?: 'horizontal' | 'diagonal' | 'vertical';
};

const directions = {
  horizontal: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
  vertical: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
};

export const GradientView = ({
  className,
  children,
  colors,
  direction = 'horizontal',
  ...props
}: GradientViewProps) => {
  const { start, end } = directions[direction];
  return (
    <LinearGradient
      colors={(colors ?? kizzoGradient) as unknown as [string, string, ...string[]]}
      start={start}
      end={end}
      className={className}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};
