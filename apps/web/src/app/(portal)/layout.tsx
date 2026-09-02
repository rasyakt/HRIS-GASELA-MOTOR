'use client';

import {
  CalendarDays,
  CheckCheck,
  BarChart3,
  Clock,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ReceiptText,
  Search,
  Settings,
  Timer,
  TrendingUp,
  Users,
  X,
  User,
  ShieldAlert,
  ShieldCheck,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/error-boundary';
import { OfflineBanner } from '@/components/offline-banner';
import { api } from '@/lib/api-client';
import { useAuthApi } from '@/lib/auth-api';
import { ROLE_LABEL, roleAtLeast } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import { GaselaLogo } from '@/components/ui/logo';
import { CommandPalette } from '@/components/command-palette';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PortalThemeProvider } from '@/components/portal-theme-provider';
import type { UserRole } from '@gasela/shared-types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole?: UserRole;
  /** Role TEPAT (bukan hierarki) — untuk peran terisolasi seperti landing_admin */
  exactRole?: UserRole;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minRole: 'employee' },
    ],
  },
  {
    label: 'Karyawan Mandiri',
    items: [
      { href: '/attendance', label: 'Kehadiran', icon: Clock, minRole: 'employee' },
      { href: '/leave', label: 'Cuti', icon: CalendarDays, minRole: 'employee' },
      { href: '/overtime', label: 'Lembur', icon: Timer, minRole: 'employee' },
      { href: '/payroll', label: 'Penggajian', icon: ReceiptText, minRole: 'employee' },
      { href: '/announcements', label: 'Pengumuman', icon: Megaphone, minRole: 'employee' },
      { href: '/discipline', label: 'Disiplin & SP', icon: ShieldAlert, minRole: 'employee' },
    ],
  },
  {
    label: 'Manajemen & Review',
    items: [
      { href: '/approvals', label: 'Persetujuan', icon: CheckCheck, minRole: 'manager' },
      { href: '/performance-reviews', label: 'Kinerja', icon: TrendingUp, minRole: 'manager' },
      { href: '/reports', label: 'Laporan', icon: BarChart3, minRole: 'manager' },
    ],
  },
  {
    label: 'Sistem Admin',
    items: [
      { href: '/employees', label: 'Karyawan', icon: Users, minRole: 'admin' },
      { href: '/landing-cms', label: 'Landing Page CMS', icon: Globe, exactRole: 'landing_admin' },
      { href: '/audit-logs', label: 'Audit Log', icon: ShieldCheck, minRole: 'admin' },
      { href: '/settings', label: 'Pengaturan', icon: Settings, minRole: 'admin' },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/attendance': 'Kehadiran',
  '/leave': 'Cuti',
  '/overtime': 'Lembur',
  '/payroll': 'Penggajian',
  '/announcements': 'Pengumuman',
  '/discipline': 'Disiplin & SP',
  '/approvals': 'Persetujuan',
  '/performance-reviews': 'Performance Review',
  '/reports': 'Laporan',
  '/employees': 'Manajemen Karyawan',
  '/audit-logs': 'Audit Log & Rekam Jejak',
  '/settings': 'Pengaturan Sistem',
  '/landing-cms': 'Landing Page CMS',
};

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const val = localStorage.getItem('sidebar_collapsed');
    if (val === 'true') setIsCollapsed(true);

    const groupsVal = localStorage.getItem('collapsed_groups');
    if (groupsVal) {
      try {
        setCollapsedGroups(JSON.parse(groupsVal));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('sidebar_collapsed', String(nextVal));
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      localStorage.setItem('collapsed_groups', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  const visibleGroups = useMemo(() => {
    if (!user) return [];
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.exactRole ? user.role === item.exactRole : roleAtLeast(user.role, item.minRole ?? 'employee'),
      ),
    })).filter((group) => group.items.length > 0);
  }, [user]);

  const totalItemsCount = useMemo(() => {
    return visibleGroups.reduce((acc, group) => acc + group.items.length, 0);
  }, [visibleGroups]);

  const authApi = useAuthApi();
  const unreadQuery = useQuery<{ unread: number }>({
    queryKey: ['announcements-unread'],
    queryFn: () => authApi<{ unread: number }>('/api/announcements/unread-count'),
    enabled: !!token,
    refetchInterval: 60_000, // refetch every 60 seconds
    retry: false,
  });
  const unreadCount = unreadQuery.data?.unread ?? 0;

  const pageTitle = PAGE_TITLES[pathname] ?? 'HRIS Gasela Motor';

  async function handleLogout() {
    setLoggingOut(true);
    try {
      if (token) {
        await api('/api/auth/logout', { method: 'POST', token });
      }
    } catch {
      // tetap lanjut logout meski server error
    } finally {
      clearSession();
      router.replace('/login');
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-400">Memuat…</p>
      </div>
    );
  }

  const sidebar = (isMobile = false) => {
    const collapsed = !isMobile && isCollapsed;
    return (
      <aside className={`flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex h-14 items-center border-b border-zinc-100 dark:border-zinc-800/80 px-4 justify-between">
          <GaselaLogo variant="full-dark" size="sm" showText={!collapsed} />
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-850 dark:hover:text-white transition-colors focus:outline-none"
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          )}
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {visibleGroups.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.label] === true;
            return (
              <div key={group.label} className="space-y-1.5">
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex w-full items-center justify-between px-3 py-1 text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase select-none hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors focus:outline-none"
                  >
                    <span>{group.label}</span>
                    {isGroupCollapsed ? (
                      <ChevronRight className="size-3" />
                    ) : (
                      <ChevronDown className="size-3" />
                    )}
                  </button>
                ) : (
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2 mx-1" />
                )}
                {(!collapsed && isGroupCollapsed) ? null : (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active =
                        pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                            active
                              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
                          } ${collapsed ? 'justify-center px-2' : ''}`}
                        >
                          <item.icon className="size-4 shrink-0" />
                          {!collapsed && <span className="flex-1 transition-opacity duration-300">{item.label}</span>}
                          {!collapsed && item.href === '/announcements' && unreadCount > 0 && (
                            <span className={`inline-flex items-center justify-center min-w-4.5 h-4.5 rounded-full px-1 text-[10px] font-bold ${
                              active ? 'bg-primary-foreground text-primary' : 'bg-red-500 text-white'
                            }`}>
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    );
  };

  return (
    <PortalThemeProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <CommandPalette />
        <OfflineBanner />
        {totalItemsCount > 1 && <div className="hidden lg:block h-full">{sidebar(false)}</div>}
        {totalItemsCount > 1 && mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0">{sidebar(true)}</div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 left-68 text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X />
            </Button>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 lg:px-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              {totalItemsCount > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu />
                </Button>
              )}
              <h1 className="text-base font-semibold text-zinc-900 dark:text-white">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Ctrl+K search trigger */}
              {totalItemsCount > 1 && (
                <button
                  onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                  className="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <Search className="size-3.5" />
                  <span>Cari fitur…</span>
                  <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 text-[10px] font-semibold dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">⌘K</kbd>
                </button>
              )}

              {/* Dark / Light Theme Toggle */}
              <ThemeToggle />

              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2.5 rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                >
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase shadow-2xs">
                    {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <span className="hidden sm:inline text-sm font-semibold text-zinc-700 dark:text-zinc-200 mr-1">
                    {user.fullName}
                  </span>
                </button>

                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-11 z-40 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {ROLE_LABEL[user.role]}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <User className="size-4" />
                        Profil Saya
                      </Link>
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <LogOut className="size-4" />
                        {loggingOut ? 'Keluar…' : 'Keluar'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 p-4 lg:p-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
    </PortalThemeProvider>
  );
}
