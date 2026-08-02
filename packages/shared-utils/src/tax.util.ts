import { z } from 'zod';
import { PTKP_STATUSES, type PtkpStatus } from '@gasela/shared-types';

const PTKP_TO_TER_CATEGORY: Record<PtkpStatus, 'A' | 'B' | 'C'> = {
  TK0: 'A',
  TK1: 'A',
  K0: 'A',
  TK2: 'B',
  TK3: 'B',
  K1: 'B',
  K2: 'B',
  K3: 'C',
};

export interface TerBracket {
  incomeFrom: number;
  incomeTo: number | null;
  ratePercent: number;
}

export interface TerRateRepository {
  findBracket(category: 'A' | 'B' | 'C', monthlyGross: number): Promise<TerBracket | null>;
}

export async function calculateMonthlyPph21Ter(
  grossMonthlyIncome: number,
  ptkpStatus: PtkpStatus,
  terRateRepository: TerRateRepository,
): Promise<number> {
  const category = PTKP_TO_TER_CATEGORY[ptkpStatus]!;
  const bracket = await terRateRepository.findBracket(category, grossMonthlyIncome);
  if (!bracket) return 0;
  return Math.round(grossMonthlyIncome * (Number(bracket.ratePercent) / 100));
}

const ANNUAL_BRACKETS = [
  { upTo: 60_000_000, rate: 0.05 },
  { upTo: 250_000_000, rate: 0.15 },
  { upTo: 500_000_000, rate: 0.25 },
  { upTo: 5_000_000_000, rate: 0.3 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.35 },
];

export function calculateAnnualPph21Progressive(pkpAnnual: number): number {
  let remaining = pkpAnnual;
  let prevCap = 0;
  let tax = 0;
  for (const b of ANNUAL_BRACKETS) {
    if (remaining <= 0) break;
    const bracketSize = b.upTo - prevCap;
    const taxableInBracket = Math.min(remaining, bracketSize);
    tax += taxableInBracket * b.rate;
    remaining -= taxableInBracket;
    prevCap = b.upTo;
  }
  return Math.round(tax);
}

/** PKP = Penghasilan Tidak Kena Pajak sesuai PTKP status. */
const PTKP_AMOUNTS: Record<PtkpStatus, number> = {
  TK0: 54_000_000,
  TK1: 58_500_000,
  TK2: 63_000_000,
  TK3: 67_500_000,
  K0: 58_500_000,
  K1: 63_000_000,
  K2: 67_500_000,
  K3: 72_000_000,
};

export const ptkpSchema = z.enum(PTKP_STATUSES);

export { PTKP_TO_TER_CATEGORY, PTKP_AMOUNTS };