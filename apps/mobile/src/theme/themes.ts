import { ColorPalette } from './design-tokens';

export const lightTheme: ColorPalette = {
  primary: '#18181b', // Brand primary
  primaryLight: '#3f3f46',
  primaryDark: '#09090b',
  secondary: '#f4f4f5',
  accent: '#3b82f6', // Brand accent (blue)

  neutral50: '#fafafa',
  neutral100: '#f4f4f5',
  neutral200: '#e4e4e7',
  neutral300: '#d4d4d8',
  neutral400: '#a1a1aa',
  neutral500: '#71717a',
  neutral600: '#52525b',
  neutral700: '#3f3f46',
  neutral800: '#27272a',
  neutral900: '#18181b',

  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  background: '#fafafa',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  border: '#e4e4e7',

  textPrimary: '#18181b',
  textSecondary: '#52525b',
  textTertiary: '#a1a1aa',
  textInverse: '#ffffff',
};

export const darkTheme: ColorPalette = {
  primary: '#ffffff', // Inverted primary
  primaryLight: '#f4f4f5',
  primaryDark: '#d4d4d8',
  secondary: '#27272a',
  accent: '#60a5fa', // Lighter accent for dark mode

  neutral50: '#18181b',
  neutral100: '#27272a',
  neutral200: '#3f3f46',
  neutral300: '#52525b',
  neutral400: '#71717a',
  neutral500: '#a1a1aa',
  neutral600: '#d4d4d8',
  neutral700: '#e4e4e7',
  neutral800: '#f4f4f5',
  neutral900: '#fafafa',

  success: '#34d399', // Lighter success for dark mode
  successLight: '#064e3b', // Darker background for light success
  warning: '#fbbf24',
  warningLight: '#78350f',
  error: '#f87171',
  errorLight: '#7f1d1d',
  info: '#60a5fa',
  infoLight: '#1e3a8a',

  background: '#09090b', // Deep dark
  surface: '#18181b', // Slightly lighter dark
  surfaceElevated: '#27272a', // Even lighter dark for elevation
  border: '#3f3f46',

  textPrimary: '#fafafa',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  textInverse: '#18181b',
};
