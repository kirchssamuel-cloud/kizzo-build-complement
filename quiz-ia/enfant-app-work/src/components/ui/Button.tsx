import * as React from 'react';
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/cn';
import { Text } from './Text';
import { colors } from '~/theme/colors';

const sizeClasses = cva('', {
  variants: {
    size: {
      default: 'h-[54px] px-6',
      sm: 'h-11 px-5',
      lg: 'h-[60px] px-7',
      icon: 'h-12 w-12 px-0',
    },
  },
  defaultVariants: { size: 'default' },
});

const textVariants = cva('font-semibold text-[16px]', {
  variants: {
    variant: {
      default: 'text-white',
      'primary-orange': 'text-white',
      outline: 'text-kz-cyan',
      'outline-blue': 'text-kz-ink dark:text-kz-white',
      ghost: 'text-kz-ink/70 dark:text-kz-white/70',
      link: 'text-kz-orange',
      destructive: 'text-white',
    },
  },
  defaultVariants: { variant: 'default' },
});

type Variant = NonNullable<VariantProps<typeof textVariants>['variant']>;

const variantBg = (variant: Variant) => {
  switch (variant) {
    case 'default':
      return 'bg-kz-cyan';
    case 'primary-orange':
      return 'bg-kz-orange';
    case 'outline':
      return 'border-2 border-kz-cyan bg-white/5 shadow-cyan-soft';
    case 'outline-blue':
      return 'border-2 border-kz-navy-mid bg-kz-navy-deep/20 shadow-cyan-soft';
    case 'ghost':
      return 'bg-transparent';
    case 'link':
      return 'bg-transparent';
    case 'destructive':
      return 'bg-kz-red';
  }
};

const glowFor = (variant: Variant) => {
  if (variant === 'default') {
    return {
      shadowColor: colors.cyanLight,
      shadowOpacity: 0.85,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 0 },
      elevation: 14,
    } as const;
  }
  if (variant === 'primary-orange') {
    return {
      shadowColor: colors.orangeLight,
      shadowOpacity: 0.85,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 0 },
      elevation: 14,
    } as const;
  }
  return null;
};

type ButtonProps = PressableProps &
  VariantProps<typeof sizeClasses> & {
    variant?: Variant;
    className?: string;
    textClassName?: string;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children?: React.ReactNode;
  };

const Inner: React.FC<{
  variant: Variant;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textClassName?: string;
  children?: React.ReactNode;
}> = ({ variant, loading, leftIcon, rightIcon, textClassName, children }) => (
  <View className="flex-row items-center justify-center">
    {loading ? (
      <ActivityIndicator
        size="small"
        color={variant === 'outline' ? colors.cyan : colors.white}
      />
    ) : (
      <>
        {leftIcon ? <View className="mr-2.5">{leftIcon}</View> : null}
        {typeof children === 'string' ? (
          <Text className={cn(textVariants({ variant }), textClassName)}>{children}</Text>
        ) : (
          children
        )}
        {rightIcon ? <View className="ml-2.5">{rightIcon}</View> : null}
      </>
    )}
  </View>
);

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      className,
      textClassName,
      variant = 'default',
      size,
      loading,
      disabled,
      leftIcon,
      rightIcon,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const glow = glowFor(variant);
    return (
      <Pressable
        ref={ref}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
        className={cn(
          'self-stretch items-center justify-center rounded-[16px] active:opacity-90 disabled:opacity-50',
          sizeClasses({ size }),
          variantBg(variant),
          className,
        )}
        style={[glow, style as any]}
        {...props}
      >
        <Inner
          variant={variant}
          loading={loading}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          textClassName={textClassName}
        >
          {children}
        </Inner>
      </Pressable>
    );
  },
);
Button.displayName = 'Button';
