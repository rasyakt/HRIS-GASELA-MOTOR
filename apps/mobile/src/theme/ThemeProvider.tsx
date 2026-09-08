import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_PORTAL_THEME,
  type PortalThemeConfig,
} from '@gasela/shared-types';
import {
  DesignTokens,
  typography,
  spacing,
  generateDynamicBorderRadius,
} from './design-tokens';
import {
  generateDynamicPalette,
  generateDynamicGradients,
} from './themes';
import api from '../services/api-client';
import { storage } from '../services/storage';
import * as SecureStore from 'expo-secure-store';

export const THEME_PREF_KEY = 'app-theme-preference';
export const PORTAL_THEME_CACHE_KEY = 'cached-portal-theme-config';

type ThemeType = 'light' | 'dark';
type ThemePreference = ThemeType | 'system';

export interface ThemeContextValue {
  theme: ThemeType;
  preference: ThemePreference;
  tokens: DesignTokens;
  themeConfig: PortalThemeConfig;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
  refetchTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme() as ThemeType | null;
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // 1. Initial cached theme config from storage
  const initialCachedConfig = useMemo<PortalThemeConfig>(() => {
    try {
      const raw = storage.getString(PORTAL_THEME_CACHE_KEY);
      if (raw) {
        return { ...DEFAULT_PORTAL_THEME, ...JSON.parse(raw) };
      }
    } catch {}
    return DEFAULT_PORTAL_THEME;
  }, []);

  const [cachedThemeConfig, setCachedThemeConfig] = useState<PortalThemeConfig>(initialCachedConfig);

  // 2. Fetch active theme config from backend
  const themeQuery = useQuery<PortalThemeConfig>({
    queryKey: ['portal-theme-config'],
    queryFn: () => api<PortalThemeConfig>('/api/settings/theme'),
    staleTime: 60_000,
    refetchInterval: 30_000,
  });

  // 3. Persist latest theme config when received
  useEffect(() => {
    if (themeQuery.data) {
      setCachedThemeConfig(themeQuery.data);
      try {
        storage.set(PORTAL_THEME_CACHE_KEY, JSON.stringify(themeQuery.data));
      } catch (e) {
        console.warn('Failed to cache theme config in mobile storage:', e);
      }
    }
  }, [themeQuery.data]);

  // 4. Load persisted theme preference on mount
  useEffect(() => {
    async function loadThemePref() {
      try {
        const storedSync = storage.getString(THEME_PREF_KEY) as ThemePreference;
        if (storedSync && (storedSync === 'light' || storedSync === 'dark' || storedSync === 'system')) {
          setPreferenceState(storedSync);
        }
        const storedAsync = await SecureStore.getItemAsync(THEME_PREF_KEY);
        if (storedAsync && (storedAsync === 'light' || storedAsync === 'dark' || storedAsync === 'system')) {
          setPreferenceState(storedAsync as ThemePreference);
          storage.set(THEME_PREF_KEY, storedAsync);
        }
      } catch (e) {
        console.warn('Failed to load theme preference', e);
      }
    }
    loadThemePref();
  }, []);

  const activeTheme: ThemeType =
    preference === 'system' ? systemColorScheme || 'light' : preference;
  const isDark = activeTheme === 'dark';

  const currentThemeConfig = themeQuery.data || cachedThemeConfig;

  // 5. Generate dynamic design tokens
  const tokens = useMemo<DesignTokens>(() => {
    const palette = generateDynamicPalette(currentThemeConfig, isDark);
    const grad = generateDynamicGradients(palette, isDark, currentThemeConfig?.presetId);
    const rad = generateDynamicBorderRadius(currentThemeConfig.radius);
    return {
      colors: palette,
      typography,
      spacing,
      borderRadius: rad,
      shadows: generateShadows(isDark),
      gradients: grad,
    };
  }, [currentThemeConfig, isDark]);

  const setTheme = (newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    try {
      storage.set(THEME_PREF_KEY, newPreference);
      SecureStore.setItemAsync(THEME_PREF_KEY, newPreference).catch(() => {});
    } catch {}
  };

  const toggleTheme = () => {
    const newTheme = activeTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const value: ThemeContextValue = {
    theme: activeTheme,
    preference,
    tokens,
    themeConfig: currentThemeConfig,
    toggleTheme,
    setTheme,
    refetchTheme: () => themeQuery.refetch(),
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
