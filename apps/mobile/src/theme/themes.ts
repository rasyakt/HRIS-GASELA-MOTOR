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

/** Helper to determine whether text should be dark or light based on background hex */
export function getContrastForeground(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  // Perceived luminance formula (YIQ)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#09090b' : '#ffffff';
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

  background: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  border: '#e2e8f0',

  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',
};

export const darkTheme: ColorPalette = {
  primary: '#10b981', // Emerald in dark mode
  primaryLight: '#34d399',
  primaryDark: '#047857',
  secondary: '#1e2433',
  accent: '#34d399',

  neutral50: '#141824',
  neutral100: '#1c2233',
  neutral200: '#2b344c',
  neutral300: '#475569',
  neutral400: '#64748b',
  neutral500: '#94a3b8',
  neutral600: '#cbd5e1',
  neutral700: '#e2e8f0',
  neutral800: '#f1f5f9',
  neutral900: '#f8fafc',

  success: '#10b981',
  successLight: '#064e3b',
  warning: '#fbbf24',
  warningLight: '#78350f',
  error: '#f87171',
  errorLight: '#7f1d1d',
  info: '#38bdf8',
  infoLight: '#0c4a6e',

  background: '#0b0f17', // Deep Obsidian Slate
  surface: '#131823',   // Refined Slate Surface
  surfaceElevated: '#1a2233',
  border: '#232c3f',    // Crisp Slate Border

  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
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
    if (preset.id === 'zinc') {
      // Classic Slate - Executive Monochrome / Slate Palette
      if (isDark) {
        base.primary = '#e2e8f0';        // Platinum Slate for crisp primary buttons/highlights
        base.primaryLight = '#f8fafc';
        base.primaryDark = '#94a3b8';    // Cool Slate 400
        base.accent = '#cbd5e1';
      } else {
        base.primary = '#1e293b';        // Slate 800
        base.primaryLight = '#334155';   // Slate 700
        base.primaryDark = '#0f172a';    // Slate 900
        base.accent = '#475569';
      }
    } else if (isDark) {
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
  presetId?: string,
): GradientPresets {
  if (isDark) {
    // Special sleek metallic slate gradient for Classic Slate
    const primaryGrad: readonly [string, string, ...string[]] =
      presetId === 'zinc'
        ? (['#1e293b', '#0f172a'] as const)
        : ([palette.primaryDark, palette.primary] as const);

    return {
      primary: primaryGrad,
      secondary: ['#1e2433', '#2a3449'] as const,
      accent: [palette.primaryDark, palette.accent] as const,
      success: ['#064e3b', '#059669'] as const,
      warning: ['#78350f', '#d97706'] as const,
      brand: primaryGrad,
    };
  }

  // Light mode
  const lightPrimaryGrad: readonly [string, string, ...string[]] =
    presetId === 'zinc'
      ? (['#1e293b', '#0f172a'] as const)
      : ([palette.primary, palette.primaryDark] as const);

  return {
    primary: lightPrimaryGrad,
    secondary: ['#475569', '#334155'] as const,
    accent: [palette.primaryLight, palette.primary] as const,
    success: ['#10b981', '#059669'] as const,
    warning: ['#f59e0b', '#d97706'] as const,
    brand: lightPrimaryGrad,
  };
}
