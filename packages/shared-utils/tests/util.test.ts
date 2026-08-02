import { describe, it, expect } from 'vitest';
import { calculateBpjs, DEFAULT_BPJS_RATES } from '../src/bpjs.util';
import { distanceInMeters } from '../src/geo.util';

describe('calculateBpjs', () => {
  it('membatasi dasar perhitungan JP sesuai cap upah', () => {
    const result = calculateBpjs(15_000_000, DEFAULT_BPJS_RATES);
    expect(result.jpEmployee).toBe(Math.round(DEFAULT_BPJS_RATES.jpCapSalary * 0.01));
  });

  it('membatasi dasar kesehatan sesuai cap upah kesehatan', () => {
    const result = calculateBpjs(25_000_000, DEFAULT_BPJS_RATES);
    expect(result.kesehatanCompany).toBe(
      Math.round(DEFAULT_BPJS_RATES.kesehatanCapSalary * 0.04),
    );
  });

  it('menghitung JHT tanpa cap', () => {
    const result = calculateBpjs(8_000_000, DEFAULT_BPJS_RATES);
    expect(result.jhtEmployee).toBe(Math.round(8_000_000 * 0.02));
  });
});

describe('distanceInMeters', () => {
  it('mengembalikan ~0 untuk koordinat sama', () => {
    expect(distanceInMeters(-6.914744, 107.60981, -6.914744, 107.60981)).toBeLessThan(1);
  });

  it('jarak antar koordinat sekecil mungkin bernilai positif', () => {
    const d = distanceInMeters(-6.914744, 107.60981, -6.9149, 107.6099);
    expect(d).toBeGreaterThan(0);
  });

  it('jarak ~111km untuk beda 1 derajat lintang', () => {
    const d = distanceInMeters(0, 0, 1, 0);
    expect(d).toBeCloseTo(111195, -2);
  });
});