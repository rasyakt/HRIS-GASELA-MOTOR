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
  Settings,
  Timer,
  Users,
  X,
  User,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/error-boundary';
import { api } from '@/lib/api-client';
import { ROLE_LABEL, roleAtLeast } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import { GaselaLogo } from '@/components/ui/logo';
import type { UserRole } from '@gasela/shared-types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole: UserRole;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minRole: 'employee' },
  { href: '/attendance', label: 'Kehadiran', icon: Clock, minRole: 'employee' },
  { href: '/leave', label: 'Cuti', icon: CalendarDays, minRole: 'employee' },
  { href: '/overtime', label: 'Lembur', icon: Timer, minRole: 'employee' },
  { href: '/payroll', label: 'Penggajian', icon: ReceiptText, minRole: 'employee' },
  { href: '/announcements', label: 'Pengumuman', icon: Megaphone, minRole: 'employee' },
  { href: '/discipline', label: 'Disiplin & SP', icon: ShieldAlert, minRole: 'employee' },
  { href: '/approvals', label: 'Persetujuan', icon: CheckCheck, minRole: 'manager' },
  { href: '/reports', label: 'Laporan', icon: BarChart3, minRole: 'manager' },
  { href: '/employees', label: 'Karyawan', icon: Users, minRole: 'admin' },
  { href: '/settings', label: 'Pengaturan', icon: Settings, minRole: 'admin' },
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
  '/reports': 'Laporan',
  '/employees': 'Karyawan',
  '/settings': 'Pengaturan',
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

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  const navItems = useMemo(
    () => (user ? NAV_ITEMS.filter((i) => roleAtLeast(user.role, i.minRole)) : []),
    [user],
  );

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

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-14 items-center border-b border-zinc-100 px-4">
        <GaselaLogo variant="full-dark" size="sm" />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="hidden lg:block h-full">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">{sidebar}</div>
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
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </Button>
            <h1 className="text-base font-semibold text-zinc-900">{pageTitle}</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2.5 rounded-full p-1.5 hover:bg-zinc-100 transition-colors focus:outline-none"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white uppercase">
                {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-zinc-700 mr-1">
                {user.fullName}
              </span>
            </button>

            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-40 w-56 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
                  <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {ROLE_LABEL[user.role]}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <User className="size-4" />
                    Profil Saya
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="size-4" />
                    {loggingOut ? 'Keluar…' : 'Keluar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 lg:p-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
