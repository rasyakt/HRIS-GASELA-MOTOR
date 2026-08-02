'use client';

import {
  CalendarDays,
  CheckCheck,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Timer,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { ROLE_LABEL, roleAtLeast } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
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
  { href: '/approvals', label: 'Persetujuan', icon: CheckCheck, minRole: 'manager' },
  { href: '/employees', label: 'Karyawan', icon: Users, minRole: 'admin' },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/attendance': 'Kehadiran',
  '/leave': 'Cuti',
  '/overtime': 'Lembur',
  '/approvals': 'Persetujuan',
  '/employees': 'Karyawan',
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
      <div className="flex h-14 items-center gap-2 border-b border-zinc-100 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
          G
        </div>
        <div className="text-sm font-semibold text-zinc-900">HRIS Gasela Motor</div>
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
      <div className="border-t border-zinc-100 p-3">
        <div className="px-2 pb-2">
          <div className="truncate text-sm font-medium text-zinc-900">
            {user.fullName}
          </div>
          <div className="text-xs text-zinc-500">
            {ROLE_LABEL[user.role] ?? user.role}
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut data-icon="inline-start" />
          {loggingOut ? 'Keluar…' : 'Keluar'}
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-full flex-1">
      <div className="hidden lg:block">{sidebar}</div>
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
            className="absolute top-3 left-[17rem] text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X />
          </Button>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
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
          <Badge className="hidden sm:inline-flex">{ROLE_LABEL[user.role]}</Badge>
        </header>
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
