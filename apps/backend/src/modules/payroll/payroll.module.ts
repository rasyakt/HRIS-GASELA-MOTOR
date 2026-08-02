import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayslipPdfService } from './payslip-pdf.service';

@Module({
  imports: [PrismaModule],
  controllers: [PayrollController],
  providers: [PayrollService, PayslipPdfService],
  exports: [PayrollService, PayslipPdfService],
})
export class PayrollModule {}
