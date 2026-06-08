import * as React from 'react';
import { Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { cn } from '~/lib/cn';
import { useTheme } from '~/theme/theme-provider';

type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  className?: string;
  disabled?: boolean;
};

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  className,
  disabled,
}) => {
  const { isDark } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!checked, disabled: !!disabled }}
      onPress={() => onCheckedChange?.(!checked)}
      disabled={disabled}
      hitSlop={8}
      className={cn(
        'h-5 w-5 items-center justify-center rounded-[6px] border-2',
        checked
          ? 'border-kz-cyan bg-kz-cyan'
          : isDark
            ? 'border-kz-cyan/60 bg-kz-surface/40'
            : 'border-kz-cyan/60 bg-white',
        disabled && 'opacity-50',
        className,
      )}
    >
      {checked ? <Check size={14} color={isDark ? '#152a4a' : '#ffffff'} strokeWidth={3} /> : null}
    </Pressable>
  );
};
