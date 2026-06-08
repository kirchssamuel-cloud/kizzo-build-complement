import * as React from 'react';
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export { useTheme } from '~/store/theme.store';
