import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// TER PPh21 bulanan — PMK 168/2023 (lampiran resmi DJP). Konversi manual ke array.
type TerRow = [number | null, number | null, number]; // [incomeFrom (null = 0), incomeTo (null = tak terbatas), ratePercent]

const TER_TABLE: Record<'A' | 'B' | 'C', TerRow[]> = {
  A: [
    [null, 5400000, 0],
    [5400000, 5650000, 0.25],
    [5650000, 5950000, 0.5],
    [5950000, 6300000, 0.75],
    [6300000, 6700000, 1],
    [6700000, 7100000, 1.25],
    [7100000, 7500000, 1.5],
    [7500000, 7950000, 1.75],
    [7950000, 8450000, 2],
    [8450000, 9000000, 2.25],
    [9000000, 9650000, 2.5],
    [9650000, 10300000, 3],
    [10300000, 11000000, 3.5],
    [11000000, 11600000, 4],
    [11600000, 12500000, 5],
    [12500000, 13700000, 6],
    [13700000, 15100000, 7],
    [15100000, 16900000, 8],
    [16900000, 19500000, 9],
    [19500000, 23000000, 10],
    [23000000, 26400000, 11],
    [26400000, 30000000, 12],
    [30000000, 35400000, 13],
    [35400000, 41700000, 14],
    [41700000, 48400000, 15],
    [48400000, 55800000, 16],
    [55800000, 63800000, 17],
    [63800000, 72500000, 18],
    [72500000, 81700000, 19],
    [81700000, 91500000, 20],
    [91500000, 102000000, 21],
    [102000000, 113000000, 22],
    [113000000, 125000000, 23],
    [125000000, 137000000, 24],
    [137000000, 150000000, 25],
    [150000000, 169000000, 26],
    [169000000, 189000000, 27],
    [189000000, 210000000, 28],
    [210000000, 232000000, 29],
    [232000000, 255000000, 30],
    [255000000, 278000000, 31],
    [278000000, 302000000, 32],
    [302000000, 326000000, 33],
    [326000000, null, 34],
  ],
  B: [
    [null, 6200000, 0],
    [6200000, 6500000, 0.25],
    [6500000, 6850000, 0.5],
    [6850000, 7300000, 0.75],
    [7300000, 9200000, 1],
    [9200000, 10700000, 1.5],
    [10700000, 12200000, 2],
    [12200000, 13700000, 2.5],
    [13700000, 15200000, 3],
    [15200000, 16900000, 3.5],
    [16900000, 17800000, 4],
    [17800000, 19700000, 5],
    [19700000, 21700000, 6],
    [21700000, 24200000, 7],
    [24200000, 26800000, 8],
    [26800000, 30300000, 9],
    [30300000, 33700000, 10],
    [33700000, 37000000, 11],
    [37000000, 40400000, 12],
    [40400000, 44200000, 13],
    [44200000, 48400000, 14],
    [48400000, 53400000, 15],
    [53400000, 59000000, 16],
    [59000000, 65100000, 17],
    [65100000, 72700000, 18],
    [72700000, 81500000, 19],
    [81500000, 91000000, 20],
    [91000000, 101000000, 21],
    [101000000, 112000000, 22],
    [112000000, 125000000, 23],
    [125000000, 143000000, 24],
    [143000000, 160000000, 25],
    [160000000, 182000000, 26],
    [182000000, 217000000, 27],
    [217000000, 254000000, 28],
    [254000000, 291000000, 29],
    [291000000, 327000000, 30],
    [327000000, 363000000, 31],
    [363000000, 405000000, 32],
    [405000000, 443000000, 33],
    [443000000, null, 34],
  ],
  C: [
    [null, 6600000, 0],
    [6600000, 6950000, 0.25],
    [6950000, 7350000, 0.5],
    [7350000, 7800000, 0.75],
    [7800000, 8850000, 1],
    [8850000, 9800000, 1.25],
    [9800000, 10950000, 1.5],
    [10950000, 11200000, 1.75],
    [11200000, 12050000, 2],
    [12050000, 12950000, 2.25],
    [12950000, 14150000, 2.5],
    [14150000, 15650000, 3],
    [15650000, 17000000, 3.5],
    [17000000, 17950000, 4],
    [17950000, 19500000, 5],
    [19500000, 21400000, 6],
    [21400000, 23500000, 7],
    [23500000, 25600000, 8],
    [25600000, 27800000, 9],
    [27800000, 30500000, 10],
    [30500000, 33200000, 11],
    [33200000, 35800000, 12],
    [35800000, 39200000, 13],
    [39200000, 41500000, 14],
    [41500000, 44500000, 15],
    [44500000, 48400000, 16],
    [48400000, 53200000, 17],
    [53200000, 58700000, 18],
    [58700000, 65000000, 19],
    [65000000, 72700000, 20],
    [72700000, 81700000, 21],
    [81700000, 90700000, 22],
    [90700000, 100600000, 23],
    [100600000, 110000000, 24],
    [110000000, 120500000, 25],
    [120500000, 131000000, 26],
    [131000000, 142000000, 27],
    [142000000, 154500000, 28],
    [154500000, 167500000, 29],
    [167500000, 183500000, 30],
    [183500000, 201800000, 31],
    [201800000, 224450000, 32],
    [224450000, 250150000, 33],
    [250150000, null, 34],
  ],
};

// Libur nasional 2026 (referensi SKB 3 Menteri — validasi ulang sebelum go-live)
const HOLIDAYS_2026: Array<[string, string]> = [
  ['2026-01-01', 'Tahun Baru 2026'],
  ['2026-03-19', 'Isra Mikraj Nabi Muhammad SAW'],
  ['2026-03-29', 'Hari Suci Nyepi'],
  ['2026-03-31', 'Wafat Isa Almasih'],
  ['2026-04-02', 'Hari Raya Idulfitri'],
  ['2026-04-03', 'Hari Raya Idulfitri'],
  ['2026-05-01', 'Hari Buruh Internasional'],
  ['2026-05-21', 'Kenaikan Isa Almasih'],
  ['2026-05-27', 'Hari Raya Iduladha'],
  ['2026-05-29', 'Tahun Baru Islam'],
  ['2026-06-01', 'Hari Lahir Pancasila'],
  ['2026-08-17', 'Hari Kemerdekaan RI'],
  ['2026-09-25', 'Maulid Nabi Muhammad SAW'],
  ['2026-12-25', 'Hari Raya Natal'],
];

const COMPANY_SETTINGS: Array<{ key: string; value: string; description: string }> = [
  {
    key: 'office.location',
    value: JSON.stringify({ lat: -6.914744, lng: 107.60981 }),
    description: 'Koordinat kantor pusat (untuk validasi geofence)',
  },
  {
    key: 'office.radius_meters',
    value: '100',
    description: 'Radius geofence check-in/out (meter)',
  },
  {
    key: 'bpjs.rates',
    value: JSON.stringify({
      kesehatanRateEmployee: 0.01,
      kesehatanRateCompany: 0.04,
      kesehatanCapSalary: 12000000,
      jhtRateEmployee: 0.02,
      jhtRateCompany: 0.037,
      jpRateEmployee: 0.01,
      jpRateCompany: 0.02,
      jpCapSalary: 10547400,
      jkkRateCompany: 0.0024,
      jkmRateCompany: 0.003,
    }),
    description: 'Rate & cap BPJS aktif (per 2026 — validasi ulang finance)',
  },
  {
    key: 'overtime.rate_multiplier_weekday',
    value: '1.5',
    description: 'Pengali upah lembur hari kerja (jam pertama & selanjutnya)',
  },
  {
    key: 'company.name',
    value: 'PT Gasela Motor',
    description: 'Nama perusahaan untuk header payslip/dokumen',
  },
  {
    key: 'attendance.checkout_earliest_buffer_minutes',
    value: '30',
    description: 'Batas waktu tercepat check-out sebelum jam shift berakhir (dalam menit)',
  },
  {
    key: 'portal.theme_config',
    value: JSON.stringify({
      presetId: 'emerald',
      radius: 'md',
      sidebarContrast: 'default',
    }),
    description: 'Konfigurasi tema & warna portal HRIS GaselaPulse',
  },
];

async function main() {
  console.log('Seeding database...');

  // --- Departemen ---
  const deptWorkshop = await prisma.department.upsert({
    where: { code: 'WSHOP' },
    update: {},
    create: { code: 'WSHOP', name: 'Workshop' },
  });
  const deptSales = await prisma.department.upsert({
    where: { code: 'SALES' },
    update: {},
    create: { code: 'SALES', name: 'Sales' },
  });
  const deptHrd = await prisma.department.upsert({
    where: { code: 'HRD' },
    update: {},
    create: { code: 'HRD', name: 'HRD & Admin' },
  });
  const deptFinance = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: { code: 'FIN', name: 'Finance' },
  });

  // --- Posisi ---
  const positions = [
    { code: 'DIR', name: 'Direktur', level: 1 },
    { code: 'HRD', name: 'HRD', level: 2 },
    { code: 'MECH', name: 'Mekanik', level: 3 },
    { code: 'ADMS', name: 'Admin Sales', level: 3 },
    { code: 'SPVG', name: 'Supervisor', level: 2 },
  ];
  for (const p of positions) {
    await prisma.position.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  // --- Shift default ---
  const shifts = [
    { name: 'Shift Pagi', startTime: '08:00:00', endTime: '17:00:00', workHours: 8 },
    { name: 'Shift Siang', startTime: '13:00:00', endTime: '22:00:00', workHours: 8 },
  ];
  for (const s of shifts) {
    const existing = await prisma.shift.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.shift.create({
        data: {
          name: s.name,
          startTime: new Date(`1970-01-01T${s.startTime}Z`),
          endTime: new Date(`1970-01-01T${s.endTime}Z`),
          gracePeriodMinutes: 15,
          workHours: s.workHours,
        },
      });
    }
  }

  // --- Jenis cuti (UU Ketenagakerjaan) ---
  const leaveTypes = [
    { code: 'CT', name: 'Cuti Tahunan', annualQuota: 12, isPaid: true, requiresDocument: false, maxConsecutiveDays: 12, minNoticeDays: 3 },
    { code: 'CS', name: 'Cuti Sakit', annualQuota: 0, isPaid: true, requiresDocument: true, maxConsecutiveDays: null, minNoticeDays: 0 },
    { code: 'CM', name: 'Cuti Menikah', annualQuota: 3, isPaid: true, requiresDocument: true, maxConsecutiveDays: 3, minNoticeDays: 7 },
    { code: 'CK', name: 'Cuti Kelahiran', annualQuota: 2, isPaid: true, requiresDocument: true, maxConsecutiveDays: 2, minNoticeDays: 3 },
    { code: 'CA', name: 'Cuti Acara Keluarga', annualQuota: 2, isPaid: true, requiresDocument: false, maxConsecutiveDays: 2, minNoticeDays: 3 },
    { code: 'CIS', name: 'Cuti Ibadah', annualQuota: 2, isPaid: true, requiresDocument: false, maxConsecutiveDays: null, minNoticeDays: 7 },
  ];
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: {},
      create: lt,
    });
  }

  // --- Komponen gaji default ---
  const salaryComponents = [
    { code: 'GAJI', name: 'Gaji Pokok', type: 'allowance' as const, calculationType: 'fixed' as const, isTaxable: true },
    { code: 'TJM', name: 'Tunjangan Makan', type: 'allowance' as const, calculationType: 'fixed' as const, defaultAmount: 500000, isTaxable: true },
    { code: 'TJT', name: 'Tunjangan Transport', type: 'allowance' as const, calculationType: 'fixed' as const, defaultAmount: 400000, isTaxable: true },
    { code: 'THR', name: 'THR', type: 'allowance' as const, calculationType: 'percentage' as const, isTaxable: true },
    { code: 'POT', name: 'Potongan Lain', type: 'deduction' as const, calculationType: 'fixed' as const, defaultAmount: 0, isTaxable: false },
  ];
  for (const sc of salaryComponents) {
    await prisma.salaryComponent.upsert({
      where: { code: sc.code },
      update: {},
      create: sc,
    });
  }

  // --- TER PPh21 ---
  const terCount = await prisma.terRate.count();
  if (terCount === 0) {
    const rows = (Object.keys(TER_TABLE) as Array<'A' | 'B' | 'C'>).flatMap((cat) =>
      TER_TABLE[cat].map(([from, to, rate]) => ({
        category: cat,
        incomeFrom: from ?? 0,
        incomeTo: to,
        ratePercent: rate,
      })),
    );
    await prisma.terRate.createMany({ data: rows });
    console.log(`  TER rates: ${rows.length} baris di-seed`);
  } else {
    console.log(`  TER rates: sudah ada ${terCount} baris, dilewati`);
  }

  // --- Company settings ---
  for (const s of COMPANY_SETTINGS) {
    await prisma.companySetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // --- Holiday 2026 ---
  for (const [date, name] of HOLIDAYS_2026) {
    await prisma.holiday.upsert({
      where: { date: new Date(date) },
      update: {},
      create: { date: new Date(date), name, isRecurringYearly: false },
    });
  }

  // Helper untuk membuat employee secara aman (mencegah duplikat employeeNumber)
  const getOrCreateEmployee = async (employeeNumber: string, data: any) => {
    const existing = await prisma.employee.findUnique({ where: { employeeNumber } });
    if (existing) return existing;
    return prisma.employee.create({ data: { employeeNumber, ...data } });
  };

  // --- Admin pertama ---
  const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!adminExists) {
    const adminEmployee = await getOrCreateEmployee('EMP-0001', {
      fullName: 'Admin HRIS',
      email: 'admin@gaselamotor.com',
      phone: '081234567890',
      joinDate: new Date('2020-01-01'),
      employmentStatus: 'active',
      employmentType: 'permanent',
      ptkpStatus: 'K2',
      basicSalary: 7500000,
      departmentId: deptHrd.id,
      positionId: (await prisma.position.findUnique({ where: { code: 'HRD' } }))!.id,
      profilePhotoUrl: null,
    });
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    await prisma.user.create({
      data: {
        employeeId: adminEmployee.id,
        username: 'admin',
        passwordHash,
        role: 'admin',
      },
    });
    console.log('  Admin dibuat: admin / Admin123!');
  } else {
    console.log('  Admin sudah ada, dilewati');
  }

  // --- Admin Landing Page (terpisah dari hierarki HRIS) ---
  const landingAdminExists = await prisma.user.findUnique({
    where: { username: 'landingadmin' },
  });
  if (!landingAdminExists) {
    const landingAdminEmployee = await getOrCreateEmployee('EMP-0006', {
      fullName: 'Admin Landing Page',
      email: 'landing@gaselamotor.com',
      phone: '081234567891',
      joinDate: new Date('2026-01-01'),
      employmentStatus: 'active',
      employmentType: 'permanent',
      ptkpStatus: 'TK0',
      basicSalary: 4500000,
      departmentId: deptHrd.id,
      positionId: (await prisma.position.findUnique({ where: { code: 'HRD' } }))!.id,
      profilePhotoUrl: null,
    });
    const passwordHash = await bcrypt.hash('Landing123!', 10);
    await prisma.user.create({
      data: {
        employeeId: landingAdminEmployee.id,
        username: 'landingadmin',
        passwordHash,
        role: 'landing_admin',
      },
    });
    console.log('  Admin Landing dibuat: landingadmin / Landing123!');
  } else {
    console.log('  Admin Landing sudah ada, dilewati');
  }

  // --- User karyawan contoh ---
  const employeeUserExists = await prisma.user.findUnique({
    where: { username: 'employee' },
  });
  if (!employeeUserExists) {
    const empEmployee = await getOrCreateEmployee('EMP-0002', {
      fullName: 'Budi Santoso (Employee)',
      email: 'budi@gaselamotor.com',
      phone: '081298765432',
      birthDate: new Date('1995-06-15'),
      joinDate: new Date('2022-03-01'),
      employmentStatus: 'active',
      employmentType: 'permanent',
      ptkpStatus: 'TK0',
      basicSalary: 4500000,
      departmentId: deptSales.id,
      positionId: (await prisma.position.findUnique({ where: { code: 'ADMS' } }))!.id,
    });
    const passwordHash = await bcrypt.hash('Employee123!', 10);
    await prisma.user.create({
      data: {
        employeeId: empEmployee.id,
        username: 'employee',
        passwordHash,
        role: 'employee',
      },
    });
    console.log('  User karyawan dibuat: employee / Employee123!');
  } else {
    console.log('  User karyawan sudah ada, dilewati');
  }

  // --- User Owner ---
  const ownerUserExists = await prisma.user.findUnique({
    where: { username: 'owner' },
  });
  if (!ownerUserExists) {
    const ownerEmployee = await getOrCreateEmployee('EMP-0003', {
      fullName: 'Owner Gasela',
      email: 'owner@gaselamotor.com',
      phone: '081222222222',
      birthDate: new Date('1980-01-01'),
      joinDate: new Date('2018-01-01'),
      employmentStatus: 'active',
      employmentType: 'permanent',
      ptkpStatus: 'K3',
      basicSalary: 15000000,
      departmentId: deptHrd.id,
      positionId: (await prisma.position.findUnique({ where: { code: 'DIR' } }))!.id,
    });
    const passwordHash = await bcrypt.hash('Owner123!', 10);
    await prisma.user.create({
      data: {
        employeeId: ownerEmployee.id,
        username: 'owner',
        passwordHash,
        role: 'owner',
      },
    });
    console.log('  User Owner dibuat: owner / Owner123!');
  } else {
    console.log('  User Owner sudah ada, dilewati');
  }

  // --- User HRD Specialist ---
  const hrdUserExists = await prisma.user.findUnique({
    where: { username: 'hrd' },
  });
  if (!hrdUserExists) {
    const hrdEmployee = await getOrCreateEmployee('EMP-0004', {
      fullName: 'HRD Specialist',
      email: 'hrd@gaselamotor.com',
      phone: '081233333333',
      birthDate: new Date('1990-05-10'),
      joinDate: new Date('2021-06-01'),
      employmentStatus: 'active',
      employmentType: 'permanent',
      ptkpStatus: 'K1',
      basicSalary: 6500000,
      departmentId: deptHrd.id,
      positionId: (await prisma.position.findUnique({ where: { code: 'HRD' } }))!.id,
    });
    const passwordHash = await bcrypt.hash('Hrd123!', 10);
    await prisma.user.create({
      data: {
        employeeId: hrdEmployee.id,
        username: 'hrd',
        passwordHash,
        role: 'hrd',
      },
    });
    console.log('  User HRD dibuat: hrd / Hrd123!');
  } else {
    console.log('  User HRD sudah ada, dilewati');
  }

  // --- User Manager ---
  const managerUserExists = await prisma.user.findUnique({
    where: { username: 'manager' },
  });
  if (!managerUserExists) {
    const managerEmployee = await getOrCreateEmployee('EMP-0005', {
      fullName: 'Manager Workshop',
      email: 'manager@gaselamotor.com',
      phone: '081244444444',
      birthDate: new Date('1988-12-25'),
      joinDate: new Date('2020-03-15'),
      employmentStatus: 'active',
      employmentType: 'permanent',
      ptkpStatus: 'K2',
      basicSalary: 8500000,
      departmentId: deptWorkshop.id,
      positionId: (await prisma.position.findUnique({ where: { code: 'SPVG' } }))!.id,
    });
    const passwordHash = await bcrypt.hash('Manager123!', 10);
    await prisma.user.create({
      data: {
        employeeId: managerEmployee.id,
        username: 'manager',
        passwordHash,
        role: 'manager',
      },
    });
    console.log('  User Manager dibuat: manager / Manager123!');
  } else {
    console.log('  User Manager sudah ada, dilewati');
  }

  // --- Backfill ptkpStatus untuk employee lama ---
  await prisma.employee.updateMany({
    where: { employeeNumber: 'EMP-0002' },
    data: { ptkpStatus: 'TK0' },
  });

  // --- Leave balance tahun berjalan untuk semua employee ---
  const year = new Date().getFullYear();
  const employees = await prisma.employee.findMany({ where: { isActive: true } });
  const annualLeave = await prisma.leaveType.findUnique({ where: { code: 'CT' } });
  if (annualLeave) {
    for (const emp of employees) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: emp.id,
            leaveTypeId: annualLeave.id,
            year,
          },
        },
        update: {},
        create: {
          employeeId: emp.id,
          leaveTypeId: annualLeave.id,
          year,
          quota: annualLeave.annualQuota,
          used: 0,
          remaining: annualLeave.annualQuota,
        },
      });
    }
  }

  console.log('Seed selesai.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
