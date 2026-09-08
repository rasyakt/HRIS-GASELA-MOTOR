const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

export function formatRupiah(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  return rupiahFormatter.format(Math.round(num));
}

export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatDate(iso: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('id-ID', opts ?? { day: '2-digit', month: 'long', year: 'numeric' }).format(
    typeof iso === 'string' ? new Date(iso) : iso,
  );
}

export function formatTime(time: string): string {
  if (typeof time !== 'string' || !time) return '';
  return time.slice(0, 5);
}

/** Durasi kerja dalam jam (HH:MM) dari dua waktu string. */
export function hoursBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = (eh || 0) * 60 + (em || 0) - ((sh || 0) * 60 + (sm || 0));
  return Math.max(0, mins / 60);
}

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
    // Pola format standar: 12.345.678.9-012.345
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