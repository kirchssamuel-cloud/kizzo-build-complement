import * as React from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { cn } from '~/lib/cn';
import { useTheme } from '~/theme/theme-provider';

export type InputProps = TextInputProps & {
  className?: string;
  focused?: boolean;
  invalid?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      className,
      focused,
      invalid,
      leftSlot,
      rightSlot,
      placeholderTextColor,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setFocused] = React.useState(false);
    const showFocus = focused ?? isFocused;
    const { isDark } = useTheme();
    return (
      <View
        className={cn(
          'h-[54px] flex-row items-center rounded-[16px] border px-5',
          isDark ? 'bg-kz-surface/40' : 'bg-kz-surface',
          invalid
            ? 'border-kz-red'
            : showFocus
              ? 'border-kz-cyan shadow-cyan-soft'
              : isDark
                ? 'border-white/5'
                : 'border-kz-stroke',
          className,
        )}
      >
        {leftSlot ? <View className="mr-2.5">{leftSlot}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={
            placeholderTextColor ??
            (isDark ? 'rgba(204,204,204,0.6)' : 'rgba(123,135,148,0.7)')
          }
          className="flex-1 font-sans text-[16px] text-kz-ink dark:text-kz-white"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightSlot}
      </View>
    );
  },
);
Input.displayName = 'Input';

export const PasswordInput = React.forwardRef<
  TextInput,
  Omit<InputProps, 'secureTextEntry' | 'rightSlot'>
>(({ ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);
  const { isDark } = useTheme();
  const Icon = visible ? Eye : EyeOff;
  return (
    <Input
      ref={ref}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoComplete="password"
      {...props}
      rightSlot={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          <Icon size={20} color={isDark ? 'rgba(250,250,250,0.6)' : 'rgba(30,41,59,0.6)'} />
        </Pressable>
      }
    />
  );
});
PasswordInput.displayName = 'PasswordInput';
