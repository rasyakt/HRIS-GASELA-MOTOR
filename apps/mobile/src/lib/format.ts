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
};

export function statusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return STATUS_LABELS[status] ?? status;
}

const STATUS_COLORS: Record<string, string> = {
  present: '#059669',
  approved: '#059669',
  active: '#059669',
  late: '#d97706',
  pending: '#d97706',
  probation: '#d97706',
  early_leave: '#7c3aed',
  absent: '#dc2626',
  rejected: '#dc2626',
  resigned: '#dc2626',
  terminated: '#dc2626',
  leave: '#0284c7',
  holiday: '#71717a',
  cancelled: '#71717a',
  contract: '#0284c7',
  magang: '#7c3aed',
};

export function statusColor(status: string | null | undefined): string {
  if (!status) return '#71717a';
  return STATUS_COLORS[status] ?? '#71717a';
}

export const OFFICE_LOCATION = { lat: -6.914744, lng: 107.60981 };
