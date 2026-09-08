import type { UserRole } from '@gasela/shared-types';

export const ROLE_ORDER: Partial<Record<UserRole, number>> = {
  employee: 0,
  manager: 1,
  hrd: 2,
  admin: 3,
  owner: 4,
  superadmin: 5,
};

export function roleAtLeast(role: UserRole, min: UserRole): boolean {
  const r = ROLE_ORDER[role];
  const m = ROLE_ORDER[min];
  if (r === undefined || m === undefined) return false;
  return r >= m;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  employee: 'Karyawan',
  manager: 'Manager',
  hrd: 'HRD',
  admin: 'Admin',
  owner: 'Owner',
  landing_admin: 'Admin Landing',
  superadmin: 'Superadmin',
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

/** Sensor NIK (KTP): menampilkan 6 digit awal dan 4 digit akhir, contoh: 320101******0001 */
export function maskNik(nik?: string | null): string {
  if (!nik || typeof nik !== 'string') return '—';
  const trimmed = nik.trim();
  if (trimmed.length < 10) return trimmed.replace(/.(?=.{2})/g, '*');
  const start = trimmed.slice(0, 6);
  const end = trimmed.slice(-4);
  return `${start}******${end}`;
}

/** Sensor NPWP: menampilkan digit awal dan akhir, contoh: 12.345.***.*-***.345 */
export function maskNpwp(npwp?: string | null): string {
  if (!npwp || typeof npwp !== 'string') return '—';
  const trimmed = npwp.trim();
  if (trimmed.length < 8) return trimmed.replace(/.(?=.{2})/g, '*');
  if (trimmed.includes('.') || trimmed.includes('-')) {
    const parts = trimmed.split(/[-.]/);
    if (parts.length >= 4) {
      return `${parts[0]}.${parts[1]}.***.*-***.${parts[parts.length - 1]}`;
    }
  }
  const start = trimmed.slice(0, 6);
  const end = trimmed.slice(-3);
  return `${start}******${end}`;
}

/** Sensor Nomor Rekening Bank: menampilkan 4 digit depan dan 4 digit belakang */
export function maskBankAccount(accountNumber?: string | null): string {
  if (!accountNumber || typeof accountNumber !== 'string') return '—';
  const trimmed = accountNumber.trim();
  if (trimmed.length <= 6) return trimmed.replace(/.(?=.{2})/g, '•');
  const start = trimmed.slice(0, 4);
  const end = trimmed.slice(-4);
  return `${start}••••${end}`;
}

/** Sensor Nomor Telepon: menampilkan 4 digit awal dan 4 digit akhir */
export function maskPhone(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '—';
  const trimmed = phone.trim();
  if (trimmed.length <= 6) return trimmed.replace(/.(?=.{2})/g, '*');
  const start = trimmed.slice(0, 4);
  const end = trimmed.slice(-4);
  return `${start}****${end}`;
}

/** Sensor Email: contoh rasya@gasela.com -> r***a@gasela.com */
export function maskEmail(email?: string | null): string {
  if (!email || typeof email !== 'string') return '—';
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 1) return trimmed;
  const user = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex);
  if (user.length <= 2) return `${user[0]}***${domain}`;
  return `${user[0]}***${user[user.length - 1]}${domain}`;
}
