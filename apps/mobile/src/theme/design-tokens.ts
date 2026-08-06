export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;

  neutral50: string;
  neutral100: string;
  neutral200: string;
  neutral300: string;
  neutral400: string;
  neutral500: string;
  neutral600: string;
  neutral700: string;
  neutral800: string;
  neutral900: string;

  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
}

export interface TypographyScale {
  fontFamily: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  fontSize: {
    xs: number; // 12px
    sm: number; // 13px
    base: number; // 14px
    lg: number; // 16px
    xl: number; // 18px
    '2xl': number; // 20px
    '3xl': number; // 24px
    '4xl': number; // 28px
  };
  lineHeight: {
    tight: number; // 1.2
    normal: number; // 1.5
    relaxed: number; // 1.75
  };
  letterSpacing: {
    tight: number; // -0.01em
    normal: number; // 0
    wide: number; // 0.01em
  };
}

export interface SpacingScale {
  xs: number; // 4px
  sm: number; // 8px
  md: number; // 12px
  base: number; // 16px
  lg: number; // 20px
  xl: number; // 24px
  '2xl': number; // 32px
  '3xl': number; // 48px
  '4xl': number; // 64px
}

export interface BorderRadiusScale {
  xs: number; // 4px
  sm: number; // 8px
  md: number; // 10px
  base: number; // 12px
  lg: number; // 16px
  xl: number; // 20px
  '2xl': number; // 24px
  '3xl': number; // 32px
  full: number; // 999px
}

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ShadowScale {
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
  xl: ShadowStyle;
  '2xl': ShadowStyle;
}

export interface GradientPresets {
  primary: string[];
  secondary: string[];
  accent: string[];
  success: string[];
  warning: string[];
  brand: string[];
}

export interface DesignTokens {
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  shadows: ShadowScale;
  gradients: GradientPresets;
}

export const typography: TypographyScale = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 13,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.01,
    normal: 0,
    wide: 0.01,
  },
};

export const spacing: SpacingScale = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const borderRadius: BorderRadiusScale = {
  xs: 4,
  sm: 8,
  md: 10,
  base: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 999,
};

export const gradients: GradientPresets = {
  primary: ['#18181b', '#3f3f46'],
  secondary: ['#52525b', '#a1a1aa'],
  accent: ['#3b82f6', '#2563eb'],
  success: ['#10b981', '#059669'],
  warning: ['#f59e0b', '#d97706'],
  brand: ['#18181b', '#27272a'],
};
