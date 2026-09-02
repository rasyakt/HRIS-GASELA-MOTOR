'use client';

import {
  BarChart3,
  CalendarDays,
  CheckCheck,
  Clock,
  LayoutDashboard,
  Megaphone,
  ReceiptText,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Timer,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { roleAtLeast } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@gasela/shared-types';

interface Command {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole: UserRole;
  keywords?: string[];
}

const ALL_COMMANDS: Command[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, minRole: 'employee', keywords: ['beranda', 'home'] },
  { id: 'attendance', label: 'Kehadiran', description: 'Absen masuk / keluar', href: '/attendance', icon: Clock, minRole: 'employee', keywords: ['absen', 'check in', 'hadir'] },
  { id: 'leave', label: 'Cuti', description: 'Pengajuan & saldo cuti', href: '/leave', icon: CalendarDays, minRole: 'employee', keywords: ['izin', 'sakit', 'libur'] },
  { id: 'overtime', label: 'Lembur', description: 'Pengajuan lembur', href: '/overtime', icon: Timer, minRole: 'employee', keywords: ['ot', 'extra'] },
  { id: 'payroll', label: 'Penggajian', description: 'Slip gaji & riwayat', href: '/payroll', icon: ReceiptText, minRole: 'employee', keywords: ['gaji', 'salary', 'slip'] },
  { id: 'announcements', label: 'Pengumuman', description: 'Berita & info perusahaan', href: '/announcements', icon: Megaphone, minRole: 'employee', keywords: ['info', 'notifikasi', 'news'] },
  { id: 'discipline', label: 'Disiplin & SP', description: 'Surat peringatan', href: '/discipline', icon: ShieldAlert, minRole: 'employee', keywords: ['sp1', 'sp2', 'sp3', 'surat peringatan'] },
  { id: 'approvals', label: 'Persetujuan', description: 'Approve cuti & lembur', href: '/approvals', icon: CheckCheck, minRole: 'manager', keywords: ['approve', 'setujui'] },
  { id: 'performance-reviews', label: 'Kinerja (Review)', description: 'Performance review karyawan', href: '/performance-reviews', icon: TrendingUp, minRole: 'manager', keywords: ['kpi', 'evaluasi', 'appraisal', 'penilaian'] },
  { id: 'reports', label: 'Laporan', description: 'Ekspor laporan CSV/Excel', href: '/reports', icon: BarChart3, minRole: 'manager', keywords: ['export', 'csv', 'excel', 'laporan'] },
  { id: 'employees', label: 'Manajemen Karyawan', description: 'Data & CRUD karyawan', href: '/employees', icon: Users, minRole: 'admin', keywords: ['karyawan', 'pegawai', 'staff', 'employee'] },
  { id: 'audit-logs', label: 'Audit Log', description: 'Rekam jejak sistem', href: '/audit-logs', icon: ShieldCheck, minRole: 'admin', keywords: ['log', 'history', 'rekam jejak'] },
  { id: 'settings', label: 'Pengaturan', description: 'Konfigurasi sistem', href: '/settings', icon: Settings, minRole: 'admin', keywords: ['config', 'setup'] },
];

export function CommandPalette() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = useMemo(() => {
    const role = user?.role ?? 'employee';
    const cmds = ALL_COMMANDS.filter((c) => roleAtLeast(role, c.minRole));
    if (!query.trim()) return cmds;
    const q = query.toLowerCase();
    return cmds.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q)) ||
        c.keywords?.some((k) => k.includes(q)),
    );
  }, [query, user?.role]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      navigate(filtered[selected].href);
    }
  }

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
    setQuery('');
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette container */}
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
          <Search className="size-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Cari halaman atau fitur…"
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded p-0.5 text-zinc-400 hover:text-zinc-600"
            >
              <X className="size-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-72 overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-zinc-400">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;
            </p>
          )}
          {filtered.map((cmd, idx) => (
            <button
              key={cmd.id}
              data-idx={idx}
              onClick={() => navigate(cmd.href)}
              onMouseEnter={() => setSelected(idx)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                idx === selected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <cmd.icon
                className={`size-4 shrink-0 ${idx === selected ? 'text-primary-foreground' : 'text-zinc-400'}`}
              />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${idx === selected ? 'text-primary-foreground font-semibold' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {cmd.label}
                </p>
                {cmd.description && (
                  <p className={`text-[11px] truncate ${idx === selected ? 'text-primary-foreground/80' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {cmd.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-zinc-100 px-4 py-2">
          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
            <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-semibold">↑↓</kbd>
            Navigasi
          </span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
            <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-semibold">↵</kbd>
            Buka
          </span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
            <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-semibold">Ctrl</kbd>
            <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-semibold">K</kbd>
            Toggle
          </span>
        </div>
      </div>
    </div>
  );
}
