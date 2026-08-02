import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PassThrough } from 'stream';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';

export interface PayslipPdfData {
  payrollNumber: string;
  employeeName: string;
  employeeNumber: string;
  department: string | null;
  companyName: string;
  periodLabel: string;
  basicSalary: number;
  overtimePay: number;
  totalAllowance: number;
  grossSalary: number;
  bpjsKesehatanEmployee: number;
  bpjsKetenagakerjaanEmployee: number;
  taxPph21: number;
  totalDeduction: number;
  netSalary: number;
  components: Array<{
    code: string;
    name: string;
    type: 'allowance' | 'deduction';
    amount: number;
  }>;
  paymentDate: string | null;
}

function rupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function monthName(m: number): string {
  const names = [
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
  return names[m - 1] ?? String(m);
}

@Injectable()
export class PayslipPdfService {
  private readonly logger = new Logger(PayslipPdfService.name);

  constructor(private readonly prisma: PrismaService) {}

  async loadPayroll(id: number): Promise<PayslipPdfData> {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: { include: { department: true } },
        components: { include: { salaryComponent: true } },
      },
    });
    if (!payroll) {
      throw new NotFoundException(`Slip gaji #${id} tidak ditemukan`);
    }
    const companyNameSetting = await this.prisma.companySetting.findUnique({
      where: { key: 'company.name' },
    });
    return {
      payrollNumber: payroll.payrollNumber,
      employeeName: payroll.employee.fullName,
      employeeNumber: payroll.employee.employeeNumber,
      department: payroll.employee.department?.name ?? null,
      companyName: companyNameSetting?.value ?? 'PT Gasela Motor',
      periodLabel: `${monthName(payroll.month)} ${payroll.year}`,
      basicSalary: Number(payroll.basicSalary),
      overtimePay: Number(payroll.overtimePay),
      totalAllowance: Number(payroll.totalAllowance),
      grossSalary: Number(payroll.grossSalary),
      bpjsKesehatanEmployee: Number(payroll.bpjsKesehatanEmployee),
      bpjsKetenagakerjaanEmployee: Number(payroll.bpjsKetenagakerjaanEmployee),
      taxPph21: Number(payroll.taxPph21),
      totalDeduction: Number(payroll.totalDeduction),
      netSalary: Number(payroll.netSalary),
      components: payroll.components.map((c) => ({
        code: c.salaryComponent.code,
        name: c.salaryComponent.name,
        type: c.type,
        amount: Number(c.amount),
      })),
      paymentDate: payroll.paymentDate
        ? payroll.paymentDate.toISOString().slice(0, 10)
        : null,
    };
  }

  generatePdf(data: PayslipPdfData): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 45, right: 45 },
      info: {
        Title: `Slip Gaji ${data.employeeName} - ${data.periodLabel}`,
        Author: data.companyName,
      },
    });
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;

    doc
      .fillColor('#111827')
      .fontSize(15)
      .text(data.companyName, { align: 'center' });
    doc.moveDown(0.2).fontSize(12).text('SLIP GAJI', { align: 'center' });
    doc
      .fontSize(9)
      .fillColor('#6b7280')
      .text(`Periode: ${data.periodLabel}  |  No: ${data.payrollNumber}`, {
        align: 'center',
      });

    doc
      .moveDown(0.6)
      .strokeColor('#d1d5db')
      .lineWidth(0.8)
      .moveTo(left, doc.y)
      .lineTo(left + pageWidth, doc.y)
      .stroke();

    doc.moveDown(0.8).fontSize(10).fillColor('#111827');
    doc.text(`Nama  : ${data.employeeName}`);
    doc.text(`NIK     : ${data.employeeNumber}`);
    doc.text(`Departemen : ${data.department ?? '-'}`);
    doc.text(`Tanggal Bayar : ${data.paymentDate ?? '-'}`);

    doc.moveDown(0.6);

    // ===== PENERIMAAN =====
    doc.fontSize(11).text('PENERIMAAN', { underline: true });
    let y = doc.y + 6;
    y = this.tableRow(
      doc,
      y,
      left,
      pageWidth,
      'Gaji Pokok',
      rupiah(data.basicSalary),
    );
    y = this.tableRow(
      doc,
      y,
      left,
      pageWidth,
      'Lembur',
      rupiah(data.overtimePay),
    );
    for (const c of data.components) {
      if (c.type !== 'allowance') continue;
      y = this.tableRow(doc, y, left, pageWidth, c.name, rupiah(c.amount));
    }
    y = this.tableRow(
      doc,
      y,
      left,
      pageWidth,
      'Total Penerimaan',
      rupiah(data.grossSalary),
      true,
    );

    doc.y = y + 12;

    // ===== POTONGAN =====
    doc.fontSize(11).text('POTONGAN', { underline: true });
    y = doc.y + 6;
    y = this.tableRow(
      doc,
      y,
      left,
      pageWidth,
      'BPJS Kesehatan (karyawan)',
      rupiah(data.bpjsKesehatanEmployee),
    );
    y = this.tableRow(
      doc,
      y,
      left,
      pageWidth,
      'BPJS Ketenagakerjaan (karyawan)',
      rupiah(data.bpjsKetenagakerjaanEmployee),
    );
    y = this.tableRow(doc, y, left, pageWidth, 'PPh 21', rupiah(data.taxPph21));
    for (const c of data.components) {
      if (c.type !== 'deduction') continue;
      y = this.tableRow(doc, y, left, pageWidth, c.name, rupiah(c.amount));
    }
    y = this.tableRow(
      doc,
      y,
      left,
      pageWidth,
      'Total Potongan',
      rupiah(data.totalDeduction),
      true,
    );

    doc.y = y + 16;

    // ===== GAJI BERSIH =====
    doc
      .fillColor('#111827')
      .fontSize(13)
      .text(`GAJI BERSIH : ${rupiah(data.netSalary)}`, { align: 'center' });

    doc
      .moveDown(1.2)
      .strokeColor('#d1d5db')
      .lineWidth(0.8)
      .moveTo(left, doc.y)
      .lineTo(left + pageWidth, doc.y)
      .stroke();

    doc
      .moveDown(0.6)
      .fontSize(8)
      .fillColor('#9ca3af')
      .text('Dokumen ini dibuat otomatis oleh sistem HRIS Gasela Motor.', {
        align: 'center',
      });

    return doc;
  }

  streamPdf(doc: PDFKit.PDFDocument): PassThrough {
    const stream = new PassThrough();
    doc.pipe(stream);
    doc.end();
    return stream;
  }

  private tableRow(
    doc: PDFKit.PDFDocument,
    y: number,
    left: number,
    pageWidth: number,
    label: string,
    value: string,
    bold = false,
  ): number {
    const font = bold ? 'Helvetica-Bold' : 'Helvetica';
    doc
      .font(font)
      .fontSize(10)
      .fillColor('#111827')
      .text(label, left, y, { width: pageWidth * 0.7 })
      .text(value, left + pageWidth * 0.7, y, {
        width: pageWidth * 0.3,
        align: 'right',
      });
    return y + 16;
  }
}
