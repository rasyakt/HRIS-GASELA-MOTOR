import { z } from 'zod';

export interface ThemePreset {
  id: string;
  label: string;
  primaryLight: string; // HEX for light mode primary
  primaryDark: string;  // HEX for dark mode primary
  primaryHoverLight: string;
  primaryHoverDark: string;
  sidebarActiveLight: string;
  sidebarActiveDark: string;
  ring: string;
  previewColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'emerald',
    label: 'Gasela Emerald',
    primaryLight: '#059669',
    primaryDark: '#10b981',
    primaryHoverLight: '#047857',
    primaryHoverDark: '#34d399',
    sidebarActiveLight: '#059669',
    sidebarActiveDark: '#10b981',
    ring: '#10b981',
    previewColor: '#10b981',
  },
  {
    id: 'zinc',
    label: 'Classic Slate',
    primaryLight: '#18181b',
    primaryDark: '#f4f4f5',
    primaryHoverLight: '#27272a',
    primaryHoverDark: '#e4e4e7',
    sidebarActiveLight: '#18181b',
    sidebarActiveDark: '#f59e0b',
    ring: '#71717a',
    previewColor: '#27272a',
  },
  {
    id: 'blue',
    label: 'Sapphire Blue',
    primaryLight: '#2563eb',
    primaryDark: '#3b82f6',
    primaryHoverLight: '#1d4ed8',
    primaryHoverDark: '#60a5fa',
    sidebarActiveLight: '#2563eb',
    sidebarActiveDark: '#3b82f6',
    ring: '#3b82f6',
    previewColor: '#2563eb',
  },
  {
    id: 'amber',
    label: 'Amber Gold',
    primaryLight: '#d97706',
    primaryDark: '#f59e0b',
    primaryHoverLight: '#b45309',
    primaryHoverDark: '#fbbf24',
    sidebarActiveLight: '#d97706',
    sidebarActiveDark: '#f59e0b',
    ring: '#f59e0b',
    previewColor: '#f59e0b',
  },
  {
    id: 'indigo',
    label: 'Royal Indigo',
    primaryLight: '#4f46e5',
    primaryDark: '#6366f1',
    primaryHoverLight: '#4338ca',
    primaryHoverDark: '#818cf8',
    sidebarActiveLight: '#4f46e5',
    sidebarActiveDark: '#6366f1',
    ring: '#6366f1',
    previewColor: '#6366f1',
  },
  {
    id: 'violet',
    label: 'Amethyst Violet',
    primaryLight: '#7c3aed',
    primaryDark: '#8b5cf6',
    primaryHoverLight: '#6d28d9',
    primaryHoverDark: '#a78bfa',
    sidebarActiveLight: '#7c3aed',
    sidebarActiveDark: '#8b5cf6',
    ring: '#8b5cf6',
    previewColor: '#8b5cf6',
  },
  {
    id: 'rose',
    label: 'Crimson Rose',
    primaryLight: '#e11d48',
    primaryDark: '#f43f5e',
    primaryHoverLight: '#be123c',
    primaryHoverDark: '#fb7185',
    sidebarActiveLight: '#e11d48',
    sidebarActiveDark: '#f43f5e',
    ring: '#f43f5e',
    previewColor: '#f43f5e',
  },
  {
    id: 'orange',
    label: 'Sunset Orange',
    primaryLight: '#ea580c',
    primaryDark: '#f97316',
    primaryHoverLight: '#c2410c',
    primaryHoverDark: '#fb923c',
    sidebarActiveLight: '#ea580c',
    sidebarActiveDark: '#f97316',
    ring: '#f97316',
    previewColor: '#f97316',
  },
  {
    id: 'cyan',
    label: 'Ocean Cyan',
    primaryLight: '#0891b2',
    primaryDark: '#06b6d4',
    primaryHoverLight: '#0e7490',
    primaryHoverDark: '#22d3ee',
    sidebarActiveLight: '#0891b2',
    sidebarActiveDark: '#06b6d4',
    ring: '#06b6d4',
    previewColor: '#06b6d4',
  },
];

export const portalThemeConfigSchema = z.object({
  presetId: z.string().default('emerald'),
  customColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Format HEX tidak valid (#RRGGBB)').optional(),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('md'),
  sidebarContrast: z.enum(['default', 'high']).default('default'),
  updatedAt: z.string().optional(),
});

export type PortalThemeConfig = z.infer<typeof portalThemeConfigSchema>;

export const DEFAULT_PORTAL_THEME: PortalThemeConfig = {
  presetId: 'emerald',
  radius: 'md',
  sidebarContrast: 'default',
};
