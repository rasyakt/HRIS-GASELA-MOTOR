/**
 * Overtime Calculation Utilities
 * ─────────────────────────────────────────────────────────────
 * Pure helper functions untuk kalkulasi lembur sesuai PP 35/2021.
 * Terpisah dari service agar dapat diuji secara mandiri (unit test).
 */

const TIME_RE = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Mengubah string 'HH:MM' atau 'HH:MM:SS' ke total menit (null jika format salah) */
export function timeToMinutes(value: string): number | null {
  const m = TIME_RE.exec(value);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Mengubah total menit ke objek Date bertipe waktu (jam + menit) */
export function minutesToDate(min: number): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    Math.floor(min / 60),
    min % 60,
    0,
  );
}

/** Mengubah Date atau string waktu ke format 'HH:MM:SS' */
export function timeToString(value: unknown): string | null {
  if (value instanceof Date) {
    const hh = String(value.getHours()).padStart(2, '0');
    const mm = String(value.getMinutes()).padStart(2, '0');
    const ss = String(value.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  if (typeof value === 'string')
    return value.length === 5 ? `${value}:00` : value;
  return null;
}

/** 'YYYY-MM-DD' → UTC-midnight dari tanggal lokal (konsisten dgn attendance) */
export function parseLocalDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Date → 'YYYY-MM-DD' */
export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Hitung durasi lembur dalam jam (2 angka desimal) dari startMin & endMin */
export function calcOvertimeHours(startMin: number, endMin: number): number {
  return Number(((endMin - startMin) / 60).toFixed(2));
}

/** Range awal & akhir bulan (UTC) dari sebuah tanggal */
export function monthRange(date: Date): { startOfMonth: Date; endOfMonth: Date } {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  return {
    startOfMonth: new Date(Date.UTC(y, m, 1)),
    endOfMonth: new Date(Date.UTC(y, m + 1, 0, 23, 59, 59)),
  };
}

/** Validasi apakah pengajuan lembur tidak melebihi X hari ke depan */
export function isBeyondFutureLimit(
  otDate: Date,
  maxDaysAhead: number,
): boolean {
  const maxFuture = new Date();
  maxFuture.setDate(maxFuture.getDate() + maxDaysAhead);
  return otDate > maxFuture;
}

/** Validasi kuota harian PP 35/2021 (max 4 jam/hari) */
export const MAX_DAILY_OVERTIME_HOURS = 4;
/** Validasi kuota bulanan PP 35/2021 (max 56 jam/bulan) */
export const MAX_MONTHLY_OVERTIME_HOURS = 56;
