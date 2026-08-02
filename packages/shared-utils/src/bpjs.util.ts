/**
 * Rate & batas upah BPJS — WAJIB divalidasi ulang tim finance/payroll sebelum go-live.
 * Nilai default disimpan juga sebagai seed `CompanySetting` supaya bisa diupdate tanpa deploy.
 */
export interface BpjsRates {
  kesehatanRateEmployee: number;
  kesehatanRateCompany: number;
  kesehatanCapSalary: number;
  jhtRateEmployee: number;
  jhtRateCompany: number;
  jpRateEmployee: number;
  jpRateCompany: number;
  jpCapSalary: number;
  jkkRateCompany: number;
  jkmRateCompany: number;
}

export const DEFAULT_BPJS_RATES: BpjsRates = {
  kesehatanRateEmployee: 0.01,
  kesehatanRateCompany: 0.04,
  kesehatanCapSalary: 12_000_000,
  jhtRateEmployee: 0.02,
  jhtRateCompany: 0.037,
  jpRateEmployee: 0.01,
  jpRateCompany: 0.02,
  jpCapSalary: 10_547_400,
  jkkRateCompany: 0.0024,
  jkmRateCompany: 0.003,
};

export interface BpjsResult {
  kesehatanEmployee: number;
  kesehatanCompany: number;
  jhtEmployee: number;
  jhtCompany: number;
  jpEmployee: number;
  jpCompany: number;
  jkkCompany: number;
  jkmCompany: number;
}

export function calculateBpjs(
  subject: number,
  rates: BpjsRates = DEFAULT_BPJS_RATES,
): BpjsResult {
  const kesehatanBase = Math.min(subject, rates.kesehatanCapSalary);
  const jpBase = Math.min(subject, rates.jpCapSalary);
  const jhtBase = subject;

  return {
    kesehatanEmployee: Math.round(kesehatanBase * rates.kesehatanRateEmployee),
    kesehatanCompany: Math.round(kesehatanBase * rates.kesehatanRateCompany),
    jhtEmployee: Math.round(jhtBase * rates.jhtRateEmployee),
    jhtCompany: Math.round(jhtBase * rates.jhtRateCompany),
    jpEmployee: Math.round(jpBase * rates.jpRateEmployee),
    jpCompany: Math.round(jpBase * rates.jpRateCompany),
    jkkCompany: Math.round(jhtBase * rates.jkkRateCompany),
    jkmCompany: Math.round(jhtBase * rates.jkmRateCompany),
  };
}

export const calculateBpjsEmployeeShare = (r: BpjsResult): number =>
  r.kesehatanEmployee + r.jhtEmployee + r.jpEmployee;

export const calculateBpjsCompanyShare = (r: BpjsResult): number =>
  r.kesehatanCompany + r.jhtCompany + r.jpCompany + r.jkkCompany + r.jkmCompany;