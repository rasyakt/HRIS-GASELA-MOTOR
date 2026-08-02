import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ApprovePayrollInput,
  CreateSalaryComponentInput,
  GeneratePayrollInput,
  MarkPaidInput,
  Paginated,
  PayrollBatchSummary,
  PayrollDetailDto,
  PayrollDto,
  PayrollQuery,
  SalaryComponentDto,
  UpdateSalaryComponentInput,
} from '@gasela/shared-types';
import {
  DEFAULT_BPJS_RATES,
  calculateBpjs,
  PTKP_TO_TER_CATEGORY,
  type BpjsRates,
} from '@gasela/shared-utils';
import { PrismaService } from '../../prisma/prisma.service';

const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function periodStart(month: number, year: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

function periodEnd(month: number, year: number): Date {
  return new Date(Date.UTC(year, month, 1));
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================== SALARY COMPONENT =====================

  async listSalaryComponents(includeInactive = false): Promise<SalaryComponentDto[]> {
    const rows = await this.prisma.salaryComponent.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { code: 'asc' },
    });
    return rows.map((r) => this.toSalaryComponentDto(r));
  }

  async getSalaryComponent(id: number) {
    const row = await this.prisma.salaryComponent.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Komponen gaji #${id} tidak ditemukan`);
    }
    return row;
  }

  async createSalaryComponent(input: CreateSalaryComponentInput) {
    const existing = await this.prisma.salaryComponent.findFirst({
      where: { code: input.code },
    });
    if (existing) {
      throw new ConflictException(`Kode komponen '${input.code}' sudah dipakai`);
    }
    const row = await this.prisma.salaryComponent.create({ data: input });
    return this.toSalaryComponentDto(row);
  }

  async updateSalaryComponent(id: number, input: UpdateSalaryComponentInput) {
    const row = await this.getSalaryComponent(id);
    if (input.code && input.code !== row.code) {
      const existing = await this.prisma.salaryComponent.findFirst({
        where: { code: input.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Kode komponen '${input.code}' sudah dipakai`);
      }
    }
    const updated = await this.prisma.salaryComponent.update({
      where: { id },
      data: input,
    });
    return this.toSalaryComponentDto(updated);
  }

  async deactivateSalaryComponent(id: number) {
    await this.getSalaryComponent(id);
    const usage = await this.prisma.payrollComponent.count({
      where: { salaryComponentId: id },
    });
    if (usage > 0) {
      throw new ConflictException(
        `Komponen sudah dipakai ${usage} slip gaji, tidak bisa dinonaktifkan`,
      );
    }
    const row = await this.prisma.salaryComponent.update({
      where: { id },
      data: { isActive: false },
    });
    return this.toSalaryComponentDto(row);
  }

  // ===================== GENERATE =====================

  async generate(input: GeneratePayrollInput): Promise<{
    batch: PayrollBatchSummary;
    items: PayrollDto[];
  }> {
    const start = periodStart(input.month, input.year);
    const end = periodEnd(input.month, input.year);
    const monthLabel = `${MONTHS_ID[input.month - 1]} ${input.year}`;

    const employees = await this.prisma.employee.findMany({
      where: {
        isActive: true,
        employmentStatus: 'active',
        ...(input.departmentId ? { departmentId: input.departmentId } : {}),
      },
      include: { department: true },
    });
    if (employees.length === 0) {
      throw new BadRequestException(
        `Tidak ada karyawan aktif untuk periode ${monthLabel}`,
      );
    }

    const [components, ratesSetting, multiplierSetting] = await Promise.all([
      this.prisma.salaryComponent.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      }),
      this.prisma.companySetting.findUnique({ where: { key: 'bpjs.rates' } }),
      this.prisma.companySetting.findUnique({
        where: { key: 'overtime.rate_multiplier_weekday' },
      }),
    ]);

    let rates: BpjsRates = DEFAULT_BPJS_RATES;
    if (ratesSetting) {
      try {
        rates = { ...DEFAULT_BPJS_RATES, ...JSON.parse(ratesSetting.value) };
      } catch {
        rates = DEFAULT_BPJS_RATES;
      }
    }
    const multiplier = multiplierSetting
      ? Number(multiplierSetting.value) || 1.5
      : 1.5;

    const existing = await this.prisma.payroll.findMany({
      where: { month: input.month, year: input.year },
      select: { employeeId: true },
    });
    const existingSet = new Set(existing.map((p) => p.employeeId));

    const seqBase = await this.prisma.payroll.count({
      where: {
        payrollNumber: {
          startsWith: `PAY-${input.year}${String(input.month).padStart(2, '0')}`,
        },
      },
    });

    const results: PayrollDto[] = [];
    let skipped = 0;
    let totalGross = 0;
    let totalNet = 0;
    let totalPph21 = 0;

    for (const emp of employees) {
      if (existingSet.has(emp.id)) {
        skipped++;
        continue;
      }

      const basicSalary = Number(emp.basicSalary);
      let totalAllowance = 0;
      let totalDeduction = 0;
      const componentRows: Array<{
        salaryComponentId: number;
        type: 'allowance' | 'deduction';
        amount: number;
      }> = [];

      for (const comp of components) {
        let amount = 0;
        if (comp.calculationType === 'percentage') {
          amount = comp.defaultAmount
            ? Math.round((basicSalary * Number(comp.defaultAmount)) / 100)
            : 0;
        } else {
          amount = comp.defaultAmount ? Number(comp.defaultAmount) : 0;
        }
        componentRows.push({
          salaryComponentId: comp.id,
          type: comp.type,
          amount,
        });
        if (comp.type === 'allowance') totalAllowance += amount;
        else totalDeduction += amount;
      }

      const otAgg = await this.prisma.overtimeRequest.aggregate({
        where: {
          employeeId: emp.id,
          status: 'approved',
          overtimeDate: { gte: start, lt: end },
        },
        _sum: { hours: true },
      });
      const otHours = Number(otAgg._sum.hours ?? 0);
      const hourlyRate = (basicSalary / 173) * multiplier;
      const overtimePay = Math.round(otHours * hourlyRate);

      const grossSalary = basicSalary + totalAllowance + overtimePay;
      const bpjs = calculateBpjs(grossSalary, rates);

      const bracket = await this.prisma.terRate.findFirst({
        where: {
          category: PTKP_TO_TER_CATEGORY[emp.ptkpStatus],
          incomeFrom: { lt: grossSalary },
          OR: [{ incomeTo: null }, { incomeTo: { gte: grossSalary } }],
        },
        orderBy: { incomeFrom: 'desc' },
      });
      const taxPph21 = bracket
        ? Math.round(grossSalary * (Number(bracket.ratePercent) / 100))
        : 0;

      const bpjsEmployeeTotal = Math.round(
        bpjs.kesehatanEmployee + bpjs.jhtEmployee + bpjs.jpEmployee,
      );
      const bpjsKetenagakerjaanEmployee = Math.round(
        bpjs.jhtEmployee + bpjs.jpEmployee,
      );
      const bpjsKetenagakerjaanCompany = Math.round(
        bpjs.jhtCompany + bpjs.jpCompany + bpjs.jkkCompany + bpjs.jkmCompany,
      );
      const netSalary =
        grossSalary - bpjsEmployeeTotal - taxPph21 - totalDeduction;

      const payrollNumber = `PAY-${input.year}${String(input.month).padStart(2, '0')}-${String(
        seqBase + results.length + 1,
      ).padStart(4, '0')}`;

      const created = await this.prisma.payroll.create({
        data: {
          payrollNumber,
          employeeId: emp.id,
          month: input.month,
          year: input.year,
          basicSalary,
          totalAllowance,
          totalDeduction,
          overtimePay,
          grossSalary,
          bpjsKesehatanEmployee: bpjs.kesehatanEmployee,
          bpjsKesehatanCompany: bpjs.kesehatanCompany,
          bpjsKetenagakerjaanEmployee,
          bpjsKetenagakerjaanCompany,
          taxPph21,
          netSalary,
          components: {
            create: componentRows,
          },
        },
        include: this.payrollInclude,
      });

      totalGross += grossSalary;
      totalNet += netSalary;
      totalPph21 += taxPph21;
      results.push(this.toPayrollDto(created));
    }

    return {
      batch: {
        batchId: `B-${Date.now()}`,
        totalEmployees: results.length,
        skipped,
        status: 'draft',
        summary: {
          totalGross,
          totalNet,
          totalPph21,
        },
      },
      items: results,
    };
  }

  // ===================== LIST / DETAIL =====================

  async list(query: PayrollQuery): Promise<Paginated<PayrollDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      ...(query.month ? { month: query.month } : {}),
      ...(query.year ? { year: query.year } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payroll.findMany({
        where,
        include: this.payrollInclude,
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { employeeId: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payroll.count({ where }),
    ]);
    return {
      items: items.map((r) => this.toPayrollDto(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async myList(employeeId: number, query: PayrollQuery): Promise<Paginated<PayrollDto>> {
    return this.list({ ...query, employeeId });
  }

  async detail(id: number): Promise<PayrollDetailDto> {
    const row = await this.prisma.payroll.findUnique({
      where: { id },
      include: this.payrollDetailInclude,
    });
    if (!row) {
      throw new NotFoundException(`Slip gaji #${id} tidak ditemukan`);
    }
    return this.toPayrollDetailDto(row);
  }

  async myDetail(employeeId: number, id: number): Promise<PayrollDetailDto> {
    const row = await this.prisma.payroll.findFirst({
      where: { id, employeeId },
      include: this.payrollDetailInclude,
    });
    if (!row) {
      throw new NotFoundException(`Slip gaji #${id} tidak ditemukan`);
    }
    return this.toPayrollDetailDto(row);
  }

  // ===================== APPROVE / PAID =====================

  async batchApprove(approverEmployeeId: number, input: ApprovePayrollInput) {
    const ids = input.payPeriods.map((p) => p.payrollId);
    const rows = await this.prisma.payroll.findMany({
      where: { id: { in: ids } },
    });
    if (rows.length !== ids.length) {
      throw new NotFoundException('Ada slip gaji yang tidak ditemukan');
    }
    const alreadyPaid = rows.filter((r) => r.status === 'paid');
    if (alreadyPaid.length > 0) {
      throw new ConflictException(
        `Slip ${alreadyPaid.map((r) => r.payrollNumber).join(', ')} sudah dibayar`,
      );
    }
    const updated = await this.prisma.$transaction(
      rows.map((r) =>
        this.prisma.payroll.update({
          where: { id: r.id },
          data: {
            status: 'approved',
            approvedById: approverEmployeeId,
            approvedAt: new Date(),
          },
          include: this.payrollInclude,
        }),
      ),
    );
    return updated.map((r) => this.toPayrollDto(r));
  }

  async markPaid(input: MarkPaidInput) {
    const rows = await this.prisma.payroll.findMany({
      where: { id: { in: input.payrollIds } },
    });
    if (rows.length !== input.payrollIds.length) {
      throw new NotFoundException('Ada slip gaji yang tidak ditemukan');
    }
    const notApproved = rows.filter((r) => r.status !== 'approved');
    if (notApproved.length > 0) {
      throw new ConflictException(
        `Slip ${notApproved.map((r) => r.payrollNumber).join(', ')} belum disetujui`,
      );
    }
    const updated = await this.prisma.$transaction(
      rows.map((r) =>
        this.prisma.payroll.update({
          where: { id: r.id },
          data: {
            status: 'paid',
            paymentDate: input.paymentDate
              ? new Date(`${input.paymentDate}T00:00:00Z`)
              : new Date(),
          },
          include: this.payrollInclude,
        }),
      ),
    );
    return updated.map((r) => this.toPayrollDto(r));
  }

  // ===================== HELPER =====================

  private payrollInclude = {
    employee: { include: { department: true } },
    approvedBy: true,
  } as const;

  private payrollDetailInclude = {
    employee: { include: { department: true } },
    approvedBy: true,
    components: { include: { salaryComponent: true } },
  } as const;

  private toSalaryComponentDto(r: {
    id: number;
    code: string;
    name: string;
    type: 'allowance' | 'deduction';
    calculationType: 'fixed' | 'percentage' | 'formula';
    defaultAmount: unknown;
    isTaxable: boolean;
    isActive: boolean;
  }): SalaryComponentDto {
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      type: r.type,
      calculationType: r.calculationType,
      defaultAmount: r.defaultAmount === null ? null : Number(r.defaultAmount),
      isTaxable: r.isTaxable,
      isActive: r.isActive,
    };
  }

  private toPayrollDto(r: {
    id: number;
    payrollNumber: string;
    employeeId: number;
    employee: { fullName: string; employeeNumber: string; department: { name: string } | null };
    month: number;
    year: number;
    basicSalary: unknown;
    totalAllowance: unknown;
    totalDeduction: unknown;
    overtimePay: unknown;
    grossSalary: unknown;
    bpjsKesehatanEmployee: unknown;
    bpjsKesehatanCompany: unknown;
    bpjsKetenagakerjaanEmployee: unknown;
    bpjsKetenagakerjaanCompany: unknown;
    taxPph21: unknown;
    netSalary: unknown;
    status: 'draft' | 'pending_approval' | 'approved' | 'paid';
    approvedById: number | null;
    approvedBy: { fullName: string } | null;
    approvedAt: Date | null;
    paymentDate: Date | null;
    createdAt: Date;
  }): PayrollDto {
    return {
      id: r.id,
      payrollNumber: r.payrollNumber,
      employeeId: r.employeeId,
      employeeNumber: r.employee.employeeNumber,
      employeeName: r.employee.fullName,
      department: r.employee.department?.name ?? null,
      month: r.month,
      year: r.year,
      basicSalary: Number(r.basicSalary),
      totalAllowance: Number(r.totalAllowance),
      totalDeduction: Number(r.totalDeduction),
      overtimePay: Number(r.overtimePay),
      grossSalary: Number(r.grossSalary),
      bpjsKesehatanEmployee: Number(r.bpjsKesehatanEmployee),
      bpjsKesehatanCompany: Number(r.bpjsKesehatanCompany),
      bpjsKetenagakerjaanEmployee: Number(r.bpjsKetenagakerjaanEmployee),
      bpjsKetenagakerjaanCompany: Number(r.bpjsKetenagakerjaanCompany),
      taxPph21: Number(r.taxPph21),
      netSalary: Number(r.netSalary),
      status: r.status,
      approvedById: r.approvedById,
      approvedByName: r.approvedBy?.fullName ?? null,
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
      paymentDate: r.paymentDate ? dayKey(r.paymentDate) : null,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private toPayrollDetailDto(r: Parameters<PayrollService['toPayrollDto']>[0] & {
    components: Array<{
      salaryComponentId: number;
      salaryComponent: { code: string; name: string };
      type: 'allowance' | 'deduction';
      amount: unknown;
    }>;
  }): PayrollDetailDto {
    return {
      ...this.toPayrollDto(r),
      components: r.components.map((c) => ({
        salaryComponentId: c.salaryComponentId,
        salaryComponentCode: c.salaryComponent.code,
        salaryComponentName: c.salaryComponent.name,
        type: c.type,
        amount: Number(c.amount),
      })),
    };
  }
}

