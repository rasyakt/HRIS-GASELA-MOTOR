'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_PORTAL_THEME,
  THEME_PRESETS,
  type CompanySettingDto,
  type PortalThemeConfig,
  type ThemePreset,
} from '@gasela/shared-types';
import { useAuthApi } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth-store';

interface PortalThemeContextType {
  themeConfig: PortalThemeConfig;
  activePreset: ThemePreset | null;
  effectivePrimary: string;
  setPreviewTheme: (config: PortalThemeConfig | null) => void;
  previewConfig: PortalThemeConfig | null;
}

const PortalThemeContext = createContext<PortalThemeContextType>({
  themeConfig: DEFAULT_PORTAL_THEME,
  activePreset: THEME_PRESETS[0],
  effectivePrimary: THEME_PRESETS[0].primaryLight,
  setPreviewTheme: () => {},
  previewConfig: null,
});

/** Helper to determine whether text should be dark or light based on background hex */
function getContrastForeground(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  // Perceived luminance formula (YIQ)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#09090b' : '#ffffff';
}

/** Helper to lighten/darken hex */
function adjustHex(hexColor: string, percent: number): string {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  let num = parseInt(hex, 16);
  let r = (num >> 16) + Math.round((255 - (num >> 16)) * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round((255 - ((num >> 8) & 0x00ff)) * (percent / 100));
  let b = (num & 0x0000ff) + Math.round((255 - (num & 0x0000ff)) * (percent / 100));
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function PortalThemeProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const authApi = useAuthApi();

  const [previewConfig, setPreviewConfig] = useState<PortalThemeConfig | null>(null);

  // Fetch company settings to get portal.theme_config
  const { data: companySettings } = useQuery<CompanySettingDto[]>({
    queryKey: ['company-settings'],
    queryFn: () => authApi<CompanySettingDto[]>('/api/settings/company'),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const serverThemeConfig = useMemo<PortalThemeConfig>(() => {
    const raw = companySettings?.find((s) => s.key === 'portal.theme_config')?.value;
    if (raw) {
      try {
        return { ...DEFAULT_PORTAL_THEME, ...JSON.parse(raw) };
      } catch (e) {
        console.error('Failed to parse portal.theme_config:', e);
      }
    }
    // Fallback to localStorage if cached
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('portal_theme_config');
      if (cached) {
        try {
          return { ...DEFAULT_PORTAL_THEME, ...JSON.parse(cached) };
        } catch {}
      }
    }
    return DEFAULT_PORTAL_THEME;
  }, [companySettings]);

  // Sync to localStorage
  useEffect(() => {
    if (serverThemeConfig && typeof window !== 'undefined') {
      localStorage.setItem('portal_theme_config', JSON.stringify(serverThemeConfig));
    }
  }, [serverThemeConfig]);

  const activeConfig = previewConfig ?? serverThemeConfig;

  const activePreset = useMemo(() => {
    return THEME_PRESETS.find((p) => p.id === activeConfig.presetId) ?? THEME_PRESETS[0];
  }, [activeConfig.presetId]);

  const isCustom = activeConfig.presetId === 'custom' && !!activeConfig.customColor;
  const primaryLight = isCustom ? activeConfig.customColor! : activePreset.primaryLight;
  const primaryDark = isCustom ? activeConfig.customColor! : activePreset.primaryDark;
  const primaryHoverLight = isCustom ? adjustHex(activeConfig.customColor!, -15) : activePreset.primaryHoverLight;
  const primaryHoverDark = isCustom ? adjustHex(activeConfig.customColor!, 15) : activePreset.primaryHoverDark;
  const ringColor = isCustom ? activeConfig.customColor! : activePreset.ring;
  const fgLight = getContrastForeground(primaryLight);
  const fgDark = getContrastForeground(primaryDark);

  const radiusMap: Record<string, string> = {
    none: '0px',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  };
  const currentRadius = radiusMap[activeConfig.radius ?? 'md'] ?? '0.5rem';

  const styleId = 'portal-theme-dynamic-styles';

  useEffect(() => {
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      :root {
        --primary: ${primaryLight} !important;
        --primary-foreground: ${fgLight} !important;
        --ring: ${ringColor} !important;
        --radius: ${currentRadius} !important;
        --portal-primary: ${primaryLight} !important;
        --portal-primary-hover: ${primaryHoverLight} !important;
        --portal-sidebar-active: ${primaryLight} !important;
        --portal-sidebar-active-fg: ${fgLight} !important;
      }
      .dark {
        --primary: ${primaryDark} !important;
        --primary-foreground: ${fgDark} !important;
        --ring: ${ringColor} !important;
        --radius: ${currentRadius} !important;
        --portal-primary: ${primaryDark} !important;
        --portal-primary-hover: ${primaryHoverDark} !important;
        --portal-sidebar-active: ${primaryDark} !important;
        --portal-sidebar-active-fg: ${fgDark} !important;
      }
    `;

    return () => {
      // Clean up when leaving portal scope
      const el = document.getElementById(styleId);
      if (el) {
        el.remove();
      }
    };
  }, [
    primaryLight,
    primaryDark,
    primaryHoverLight,
    primaryHoverDark,
    fgLight,
    fgDark,
    ringColor,
    currentRadius,
  ]);

  return (
    <PortalThemeContext.Provider
      value={{
        themeConfig: activeConfig,
        activePreset: isCustom ? null : activePreset,
        effectivePrimary: primaryLight,
        setPreviewTheme: setPreviewConfig,
        previewConfig,
      }}
    >
      {children}
    </PortalThemeContext.Provider>
  );
}

export function usePortalTheme() {
  return useContext(PortalThemeContext);
}
