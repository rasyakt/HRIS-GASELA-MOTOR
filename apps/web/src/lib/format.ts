import type { UserRole } from '@gasela/shared-types';

export const ROLE_ORDER: Record<UserRole, number> = {
  employee: 0,
  manager: 1,
  hrd: 2,
  admin: 3,
  owner: 4,
};

export function roleAtLeast(role: UserRole, min: UserRole): boolean {
  return ROLE_ORDER[role] >= ROLE_ORDER[min];
}

export const ROLE_LABEL: Record<UserRole, string> = {
  employee: 'Karyawan',
  manager: 'Manager',
  hrd: 'HRD',
  admin: 'Admin',
  owner: 'Owner',
};

export function fmtTime(value: string | null | undefined): string {
  if (!value) return '—';
  if (value.includes('T')) return value.slice(11, 16);
  if (value.length >= 5) return value.slice(0, 5);
  return value;
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const iso = typeof value === 'string' ? value : value.toISOString();
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  const [, y, m, d] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))).toLocaleDateString(
    'id-ID',
    { day: 'numeric', month: 'short', year: 'numeric' },
  );
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('id-ID');
}

export function fmtHours(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

export function todayInput(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const STATUS_LABELS: Record<string, string> = {
  present: 'Hadir',
  late: 'Terlambat',
  early_leave: 'Pulang Cepat',
  absent: 'Absen',
  leave: 'Cuti',
  holiday: 'Libur',
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
  active: 'Aktif',
  probation: 'Percobaan',
  resigned: 'Mengundurkan Diri',
  terminated: 'PHK',
  permanent: 'Tetap',
  contract: 'Kontrak',
  magang: 'Magang',
  male: 'Laki-laki',
  female: 'Perempuan',
};

export function statusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return STATUS_LABELS[status] ?? status;
}

const STATUS_CLASSES: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-emerald-100 text-emerald-700',
  active: 'bg-emerald-100 text-emerald-700',
  late: 'bg-amber-100 text-amber-700',
  pending: 'bg-amber-100 text-amber-700',
  probation: 'bg-amber-100 text-amber-700',
  early_leave: 'bg-violet-100 text-violet-700',
  absent: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  resigned: 'bg-red-100 text-red-700',
  terminated: 'bg-red-100 text-red-700',
  leave: 'bg-sky-100 text-sky-700',
  holiday: 'bg-zinc-100 text-zinc-600',
  cancelled: 'bg-zinc-100 text-zinc-600',
  contract: 'bg-sky-100 text-sky-700',
  magang: 'bg-violet-100 text-violet-700',
};

export function statusClass(status: string | null | undefined): string {
  if (!status) return 'bg-zinc-100 text-zinc-600';
  return (
    STATUS_CLASSES[status] ?? 'bg-zinc-100 text-zinc-600'
  );
}

export function badgeClass(status: string | null | undefined): string {
  return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(
    status,
  )}`;
}

export const OFFICE_LOCATION = { lat: -6.914744, lng: 107.60981 };
