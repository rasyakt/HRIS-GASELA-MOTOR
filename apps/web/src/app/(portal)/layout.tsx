'use client';

import {
  CalendarDays,
  CheckCheck,
  BarChart3,
  Clock,
  Code2,
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
  exact?: boolean;
}

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function getNavGroups(role: UserRole): NavGroup[] {
  if (role === 'admin' || role === 'hrd' || role === 'superadmin') {
    return [
      {
        label: 'Aktivitas Utama',
        items: [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/employees', label: 'Karyawan', icon: Users },
          { href: '/approvals', label: 'Persetujuan', icon: CheckCheck },
        ],
      },
      {
        label: 'Operasional Personalia',
        items: [
          { href: '/attendance', label: 'Kehadiran', icon: Clock },
          { href: '/leave', label: 'Cuti', icon: CalendarDays },
          { href: '/overtime', label: 'Lembur', icon: Timer },
          { href: '/payroll', label: 'Penggajian', icon: ReceiptText },
          { href: '/announcements', label: 'Pengumuman', icon: Megaphone },
          { href: '/discipline', label: 'Disiplin & SP', icon: ShieldAlert },
        ],
      },
      {
        label: 'Laporan & Kinerja',
        items: [
          { href: '/reports', label: 'Laporan', icon: BarChart3 },
          { href: '/performance-reviews', label: 'Kinerja', icon: TrendingUp },
          ...(role === 'admin' || role === 'superadmin'
            ? [{ href: '/audit-logs', label: 'Audit Log', icon: ShieldCheck }]
            : []),
        ],
      },
      {
        label: 'Sistem',
        items: [
          {
            href: '/settings',
            label: 'Pengaturan',
            icon: Settings,
          },
        ],
      },
      ...(role === 'superadmin'
        ? [
            {
              label: 'Developer Hub',
              items: [
                {
                  href: '/developer',
                  label: 'Menu Developer',
                  icon: Code2,
                },
              ],
            },
          ]
        : []),
    ];
  }

  if (role === 'owner') {
    return [
      {
        label: 'Ringkasan Eksekutif',
        items: [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Laporan & Analitik',
        items: [
          { href: '/reports', label: 'Laporan', icon: BarChart3 },
          { href: '/performance-reviews', label: 'Kinerja', icon: TrendingUp },
          { href: '/audit-logs', label: 'Audit Log', icon: ShieldCheck },
        ],
      },
      {
        label: 'Direktori & Informasi',
        items: [
          { href: '/employees', label: 'Karyawan', icon: Users },
          { href: '/announcements', label: 'Pengumuman', icon: Megaphone },
        ],
      },
    ];
  }

  if (role === 'manager') {
    return [
      {
        label: 'Aktivitas Utama & Tim',
        items: [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/approvals', label: 'Persetujuan', icon: CheckCheck },
          { href: '/performance-reviews', label: 'Kinerja', icon: TrendingUp },
          { href: '/reports', label: 'Laporan', icon: BarChart3 },
        ],
      },
      {
        label: 'Karyawan Mandiri',
        items: [
          { href: '/attendance', label: 'Kehadiran', icon: Clock },
          { href: '/leave', label: 'Cuti', icon: CalendarDays },
          { href: '/overtime', label: 'Lembur', icon: Timer },
          { href: '/payroll', label: 'Penggajian', icon: ReceiptText },
          { href: '/announcements', label: 'Pengumuman', icon: Megaphone },
          { href: '/discipline', label: 'Disiplin & SP', icon: ShieldAlert },
        ],
      },
    ];
  }

  if (role === 'landing_admin') {
    return [
      {
        label: 'CMS Unit Bisnis',
        items: [
          { href: '/landing-cms', label: 'Landing Page CMS', icon: Globe },
        ],
      },
    ];
  }

  // Default: employee
  return [
    {
      label: 'Overview',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Aktivitas Mandiri',
      items: [
        { href: '/attendance', label: 'Kehadiran', icon: Clock },
        { href: '/leave', label: 'Cuti', icon: CalendarDays },
        { href: '/overtime', label: 'Lembur', icon: Timer },
        { href: '/payroll', label: 'Penggajian', icon: ReceiptText },
        { href: '/announcements', label: 'Pengumuman', icon: Megaphone },
        { href: '/discipline', label: 'Disiplin & SP', icon: ShieldAlert },
      ],
    },
  ];
}

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
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
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
    if (hasHydrated && !token) {
      router.replace('/login');
    } else if (hasHydrated && user?.mustChangePassword) {
      router.replace('/force-change-password');
    }
  }, [hasHydrated, token, user, router]);

  const visibleGroups = useMemo(() => {
    if (!user) return [];
    return getNavGroups(user.role);
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

  const approvalsCountQuery = useQuery<{ count: number }>({
    queryKey: ['sidebar-approvals-count'],
    queryFn: async () => {
      try {
        const [leaveRes, otRes] = await Promise.all([
          authApi<{ total?: number }>('/api/leaves/requests?status=pending&limit=1'),
          authApi<{ total?: number }>('/api/overtime/requests?status=pending&limit=1'),
        ]);
        return { count: (leaveRes?.total ?? 0) + (otRes?.total ?? 0) };
      } catch {
        return { count: 0 };
      }
    },
    enabled: !!token && (user?.role === 'admin' || user?.role === 'hrd' || user?.role === 'manager'),
    refetchInterval: 30_000,
    retry: false,
  });
  const pendingApprovalsCount = approvalsCountQuery.data?.count ?? 0;

  // BUG-008 FIX: Gunakan startsWith agar sub-route seperti /employees/123
  // menampilkan title yang benar ("Karyawan"), bukan "HRIS Gasela Motor"
  // Sebelumnya: exact-match only → semua sub-route dapat title generik
  const pageTitle =
    Object.entries(PAGE_TITLES).find(
      ([key]) => pathname === key || pathname.startsWith(key + '/')
    )?.[1] ?? 'HRIS Gasela Motor';

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

  const isManagement = useMemo(() => {
    if (!user) return false;
    return (
      user.role === 'admin' ||
      user.role === 'hrd' ||
      user.role === 'superadmin' ||
      user.role === 'owner' ||
      user.role === 'manager'
    );
  }, [user]);

  const bottomNavItems = useMemo<BottomNavItem[]>(() => {
    if (!user || isManagement) return [];
    if (user.role === 'landing_admin') {
      return [
        { href: '/landing-cms', label: 'CMS', icon: Globe },
        { href: '/profile', label: 'Profil', icon: User },
      ];
    }
    // Employee: 5 core self-service items, zero menu redundancy
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/attendance', label: 'Presensi', icon: Clock },
      { href: '/leave', label: 'Cuti', icon: CalendarDays },
      { href: '/overtime', label: 'Lembur', icon: Timer },
      { href: '/payroll', label: 'Gaji', icon: ReceiptText },
    ];
  }, [user, isManagement]);

  if (!hasHydrated || !user) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200" />
          <p className="text-xs font-medium text-zinc-400">Memuat…</p>
        </div>
      </div>
    );
  }

  const sidebar = (isMobile = false) => {
    const collapsed = !isMobile && isCollapsed;
    return (
      <aside className={`flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 transition-all duration-300 ${
        isMobile ? 'w-full' : (collapsed ? 'w-16' : 'w-64')
      }`}>
        <div className="flex h-14 items-center border-b border-zinc-100 dark:border-zinc-800/80 px-4 justify-between">
          <GaselaLogo variant="full-dark" size="sm" showText={!collapsed} />
          {!isMobile ? (
            <button
              onClick={toggleCollapse}
              className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-850 dark:hover:text-white transition-colors focus:outline-none"
              title={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          ) : (
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-850 dark:hover:text-white transition-colors focus:outline-none"
              title="Tutup menu"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3 no-scrollbar">
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
                          {!collapsed && item.href === '/approvals' && pendingApprovalsCount > 0 && (
                            <span className={`inline-flex items-center justify-center min-w-4.5 h-4.5 rounded-full px-1.5 text-[10px] font-bold ${
                              active ? 'bg-primary-foreground text-primary' : 'bg-amber-500 text-white'
                            }`}>
                              {pendingApprovalsCount > 99 ? '99+' : pendingApprovalsCount}
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

        {/* Mobile Drawer Footer User Profile */}
        {isMobile && (
          <div className="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 p-3">
            <div className="flex items-center gap-2.5 px-2 py-1.5 mb-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase shrink-0">
                {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{user.fullName}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{ROLE_LABEL[user.role]}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>{loggingOut ? 'Keluar…' : 'Keluar'}</span>
            </button>
          </div>
        )}
      </aside>
    );
  };

  return (
    <PortalThemeProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <CommandPalette />
        <OfflineBanner />
        {totalItemsCount > 1 && <div className="hidden lg:block h-full">{sidebar(false)}</div>}
        
        {/* Mobile Drawer Overlay - Only for Management roles */}
        {isManagement && mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              {sidebar(true)}
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-3 sm:px-4 lg:px-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {isManagement && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden shrink-0 size-8 cursor-pointer"
                  onClick={() => setMobileOpen(true)}
                  title="Buka menu navigasi"
                >
                  <Menu className="size-5" />
                </Button>
              )}
              <h1 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white truncate">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Mobile Quick Search icon trigger */}
              {totalItemsCount > 1 && (
                <button
                  onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                  className="flex sm:hidden items-center justify-center size-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
                  title="Cari fitur"
                >
                  <Search className="size-4" />
                </button>
              )}

              {/* Desktop Ctrl+K search trigger */}
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

              {/* User Profile Avatar & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
                >
                  <div className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase shadow-2xs">
                    {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <span className="hidden sm:inline text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 mr-1 max-w-32 truncate">
                    {user.fullName}
                  </span>
                </button>

                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-11 z-40 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {ROLE_LABEL[user.role]}
                        </p>
                      </div>

                      {/* Theme Toggle option */}
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors mb-1">
                        <span className="text-zinc-600 dark:text-zinc-400">Mode Tampilan</span>
                        <ThemeToggle />
                      </div>

                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

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
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
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

          <main className={`flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 p-3 sm:p-4 lg:p-6 lg:pb-6 ${
            isManagement ? 'pb-6' : 'pb-20'
          }`}>
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>

          {/* Mobile Bottom Navigation Bar - Only for Regular Employees / Non-management */}
          {!isManagement && bottomNavItems.length > 0 && (
            <nav className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-zinc-200/90 bg-white/95 backdrop-blur-md px-1 py-1 dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden pb-safe">
              {bottomNavItems.map((item) => {
                const active = item.href ? (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) : false;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.href) router.push(item.href);
                    }}
                    className={`relative flex flex-1 flex-col items-center justify-center py-1 text-[10px] sm:text-[11px] font-medium transition-colors cursor-pointer ${
                      active
                        ? 'text-primary dark:text-zinc-100 font-bold'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <div className="relative">
                      <item.icon className={`size-5 ${active ? 'stroke-[2.25]' : 'stroke-1.5'}`} />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white shadow-xs">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span className="mt-0.5 tracking-tight truncate max-w-[56px] sm:max-w-[64px]">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </PortalThemeProvider>
  );
}
