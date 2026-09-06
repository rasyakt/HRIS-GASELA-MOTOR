import { THEME_PRESETS, type PortalThemeConfig } from '@gasela/shared-types';
import { ColorPalette, GradientPresets } from './design-tokens';

/** Helper to lighten/darken hex */
export function adjustHex(hexColor: string, percent: number): string {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const num = parseInt(hex, 16);
  if (isNaN(num)) return hexColor;
  let r = (num >> 16) + Math.round((255 - (num >> 16)) * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round((255 - ((num >> 8) & 0x00ff)) * (percent / 100));
  let b = (num & 0x0000ff) + Math.round((255 - (num & 0x0000ff)) * (percent / 100));
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export const lightTheme: ColorPalette = {
  primary: '#059669', // Default Gasela Emerald
  primaryLight: '#34d399',
  primaryDark: '#047857',
  secondary: '#f4f4f5',
  accent: '#10b981',

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
  primary: '#10b981', // Emerald in dark mode
  primaryLight: '#34d399',
  primaryDark: '#047857',
  secondary: '#27272a',
  accent: '#34d399',

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

  success: '#34d399',
  successLight: '#064e3b',
  warning: '#fbbf24',
  warningLight: '#78350f',
  error: '#f87171',
  errorLight: '#7f1d1d',
  info: '#60a5fa',
  infoLight: '#1e3a8a',

  background: '#09090b',
  surface: '#18181b',
  surfaceElevated: '#27272a',
  border: '#27272a',

  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  textInverse: '#09090b',
};

/** Generate dynamic color palette based on Superadmin PortalThemeConfig */
export function generateDynamicPalette(
  config: PortalThemeConfig | null | undefined,
  isDark: boolean,
): ColorPalette {
  const base = isDark ? { ...darkTheme } : { ...lightTheme };
  if (!config) return base;

  const preset = THEME_PRESETS.find((p) => p.id === config.presetId) ?? THEME_PRESETS[0];
  const isCustom = config.presetId === 'custom' && !!config.customColor;

  if (isCustom && config.customColor) {
    const hex = config.customColor;
    if (isDark) {
      base.primary = adjustHex(hex, 15);
      base.primaryLight = adjustHex(hex, 35);
      base.primaryDark = hex;
      base.accent = adjustHex(hex, 25);
    } else {
      base.primary = hex;
      base.primaryLight = adjustHex(hex, 25);
      base.primaryDark = adjustHex(hex, -20);
      base.accent = hex;
    }
  } else if (preset) {
    if (isDark) {
      base.primary = preset.primaryDark;
      base.primaryLight = preset.primaryHoverDark || adjustHex(preset.primaryDark, 20);
      base.primaryDark = preset.primaryHoverLight || adjustHex(preset.primaryDark, -20);
      base.accent = preset.ring || preset.primaryDark;
    } else {
      base.primary = preset.primaryLight;
      base.primaryLight = preset.primaryHoverDark || adjustHex(preset.primaryLight, 25);
      base.primaryDark = preset.primaryHoverLight || adjustHex(preset.primaryLight, -20);
      base.accent = preset.ring || preset.primaryLight;
    }
  }

  return base;
}

/** Generate dynamic gradient presets */
export function generateDynamicGradients(
  palette: ColorPalette,
  isDark: boolean,
): GradientPresets {
  if (isDark) {
    return {
      primary: [palette.primaryDark, palette.primary] as const,
      secondary: ['#27272a', '#3f3f46'] as const,
      accent: [palette.primary, palette.primaryLight] as const,
      success: ['#064e3b', '#059669'] as const,
      warning: ['#78350f', '#d97706'] as const,
      brand: ['#18181b', '#27272a'] as const,
    };
  }
  return {
    primary: [palette.primary, palette.primaryDark] as const,
    secondary: ['#52525b', '#71717a'] as const,
    accent: [palette.primaryLight, palette.primary] as const,
    success: ['#10b981', '#059669'] as const,
    warning: ['#f59e0b', '#d97706'] as const,
    brand: [palette.primary, palette.primaryDark] as const,
  };
}
