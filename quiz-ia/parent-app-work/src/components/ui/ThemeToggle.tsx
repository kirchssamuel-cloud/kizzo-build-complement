import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { cn } from '~/lib/cn';
import { useTheme } from '~/theme/theme-provider';
import { Text } from './Text';
import { colors } from '~/theme/colors';

type ThemeToggleProps = {
  className?: string;
  variant?: 'pill' | 'icon';
};

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, variant = 'pill' }) => {
  const { isDark, setMode } = useTheme();
  const toggle = () => setMode(isDark ? 'light' : 'dark');
  const Icon = isDark ? Sun : Moon;

  if (variant === 'icon') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
        onPress={toggle}
        className={cn(
          'h-10 w-10 items-center justify-center rounded-full border',
          isDark
            ? 'border-white/10 bg-kz-surface-soft'
            : 'border-kz-stroke bg-white shadow-cyan-soft',
          className,
        )}
      >
        <Icon size={18} color={isDark ? colors.yellow : '#1e293b'} strokeWidth={2} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      onPress={toggle}
      className={cn(
        'flex-row items-center gap-2 rounded-full border px-3 py-2',
        isDark
          ? 'border-white/10 bg-kz-surface-soft/60'
          : 'border-kz-stroke bg-white shadow-cyan-soft',
        className,
      )}
    >
      <Icon size={14} color={isDark ? colors.yellow : '#1e293b'} strokeWidth={2} />
      <Text className="font-medium text-[12px] text-kz-ink dark:text-kz-white">
        {isDark ? 'Mode clair' : 'Mode sombre'}
      </Text>
    </Pressable>
  );
};
