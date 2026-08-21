import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { DesignTokens, GradientPresets, typography, spacing, borderRadius } from './design-tokens';
import { lightTheme, darkTheme } from './themes';

// Dummy storage for Expo Go compatibility in MVP
export const themeStorage = {
  getString: (key: string): string | undefined => undefined,
  set: (key: string, value: string) => {},
};

type ThemeType = 'light' | 'dark';
type ThemePreference = ThemeType | 'system';

export interface ThemeContextValue {
  theme: ThemeType;
  preference: ThemePreference;
  tokens: DesignTokens;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'app-theme-preference';

// Default shadow values. In a real app we might animate these or keep them static
// based on theme. Here we compute them quickly.
const generateShadows = (isDark: boolean) => {
  const color = isDark ? '#000000' : '#18181b';
  return {
    sm: { shadowColor: color, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
    lg: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
    xl: { shadowColor: color, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 12 },
    '2xl': { shadowColor: color, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 16 },
  };
};

// Generate gradients based on theme
const generateGradients = (isDark: boolean): GradientPresets => {
  if (isDark) {
    return {
      primary: ['#1e40af', '#3b82f6'], // Blue gradient for dark mode
      secondary: ['#374151', '#52525b'],
      accent: ['#2563eb', '#60a5fa'],
      success: ['#047857', '#34d399'],
      warning: ['#d97706', '#fbbf24'],
      brand: ['#1e293b', '#334155'],
    } as const;
  }
  return {
    primary: ['#18181b', '#3f3f46'],
    secondary: ['#52525b', '#a1a1aa'],
    accent: ['#3b82f6', '#2563eb'],
    success: ['#10b981', '#059669'],
    warning: ['#f59e0b', '#d97706'],
    brand: ['#18181b', '#27272a'],
  } as const;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme() as ThemeType | null;
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    // Load persisted theme on mount
    try {
      const storedTheme = themeStorage.getString(THEME_STORAGE_KEY) as ThemePreference;
      if (storedTheme) {
        setPreferenceState(storedTheme);
      }
    } catch (e) {
      console.warn('Failed to load theme preference', e);
    }
  }, []);

  const activeTheme: ThemeType = preference === 'system' ? (systemColorScheme || 'light') : preference;
  const isDark = activeTheme === 'dark';

  const tokens: DesignTokens = {
    colors: isDark ? darkTheme : lightTheme,
    typography,
    spacing,
    borderRadius,
    shadows: generateShadows(isDark),
    gradients: generateGradients(isDark),
  };

  const setTheme = (newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    themeStorage.set(THEME_STORAGE_KEY, newPreference);
  };

  const toggleTheme = () => {
    const newTheme = activeTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const value: ThemeContextValue = {
    theme: activeTheme,
    preference,
    tokens,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
