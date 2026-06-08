export const colors = {
  cyan: '#3db4d9',
  cyanLight: '#2cbfed',
  orange: '#f97316',
  orangeLight: '#ff9d5c',
  yellow: '#fab43b',
  red: '#ef4444',
  green: '#1ed760',
  greenEmerald: '#00A63E',
  white: '#fafafa',

  primary: '#3db4d9',
  ink: '#fafafa', 
  inkSoft: 'rgba(250,250,250,0.7)',
  muted: 'rgba(250,250,250,0.5)',
  bg: '#152a4a',
  bgDark: '#0a1526',
  soft: '#1e293b',
  card: '#1e3a5f',
  cardDark: '#1e293b',
  stroke: 'rgba(255,255,255,0.05)',
  strokeDark: '#2c5e92',
  success: '#1ed760',
  danger: '#ef4444',
  warning: '#fab43b',
  appleBg: '#1e293b',
  grey: '#cccccc',
} as const;

export const themeColors = {
  dark: {
    bgTop: '#152a4a',
    bgBottom: '#0a1526',
    surface: '#1e3a5f',
    surfaceSoft: '#1e293b',
    surfaceStrong: '#2c5e92',
    stroke: 'rgba(255,255,255,0.05)',
    ink: '#fafafa',
    inkSoft: 'rgba(250,250,250,0.8)',
    inkMuted: 'rgba(250,250,250,0.5)',
  },
  light: {
    bgTop: '#F4F8FA',
    bgBottom: '#E6EEF3',
    surface: '#ffffff',
    surfaceSoft: '#F4F8FA',
    surfaceStrong: '#D6E2EE',
    stroke: 'rgba(30,41,59,0.08)',
    ink: '#1e293b',
    inkSoft: '#4A5568',
    inkMuted: '#7B8794',
  },
} as const;

export const kizzoBgGradient = {
  dark: ['#152a4a', '#0a1526'] as const,
  light: ['#F4F8FA', '#E6EEF3'] as const,
};

export const kizzoCyanGradient = ['#2cbfed', '#3db4d9', '#2cbfed'] as const;
export const kizzoOrangeGradient = ['#f97316', '#ff9d5c'] as const;
export const kizzoGradient = kizzoCyanGradient;
