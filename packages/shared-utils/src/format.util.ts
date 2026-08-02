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