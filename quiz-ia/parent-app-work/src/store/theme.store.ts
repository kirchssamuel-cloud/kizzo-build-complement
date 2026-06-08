import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  systemScheme: ColorScheme;
};

type ThemeActions = {
  setMode: (next: ThemeMode) => void;
  _setSystemScheme: (next: ColorScheme) => void;
};

const initialSystemScheme: ColorScheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set) => ({
      mode: 'system',
      systemScheme: initialSystemScheme,
      setMode: (next) => set({ mode: next }),
      _setSystemScheme: (next) =>
        set((s) => (s.systemScheme === next ? s : { systemScheme: next })),
    }),
    {
      name: 'kizzo-parent.theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ mode: s.mode }),
    },
  ),
);

const subscribeToSystemAppearance = () => {
  Appearance.addChangeListener(({ colorScheme }) => {
    useThemeStore.getState()._setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
  });
};
subscribeToSystemAppearance();

export const selectIsDark = (s: ThemeState): boolean =>
  s.mode === 'system' ? s.systemScheme === 'dark' : s.mode === 'dark';
export const useIsDark = (): boolean => useThemeStore(selectIsDark);
export const useTheme = () => {
  const mode = useThemeStore((s) => s.mode);
  const isDark = useThemeStore(selectIsDark);
  const setMode = useThemeStore((s) => s.setMode);
  return { mode, isDark, setMode } as const;
};
