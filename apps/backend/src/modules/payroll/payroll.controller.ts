import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthUser } from '@gasela/shared-types';
import { PayrollService } from './payroll.service';
import { PayslipPdfService } from './payslip-pdf.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  ApprovePayrollDto,
  CreateSalaryComponentDto,
  GeneratePayrollDto,
  MarkPaidDto,
  PayrollQueryDto,
  UpdateSalaryComponentDto,
} from './dto/payroll.dto';

@ApiTags('Payroll')
@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly payslipPdfService: PayslipPdfService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get('salary-components')
  @Roles('admin', 'hrd', 'owner')
  @ApiOperation({ summary: 'Daftar komponen gaji (opsi includeInactive)' })
  listSalaryComponents(@Query('includeInactive') includeInactive?: string) {
    return this.payrollService.listSalaryComponents(includeInactive === 'true');
  }

  @Post('salary-components')
  @Roles('admin', 'hrd', 'owner')
  @ApiOperation({ summary: 'Buat komponen gaji (admin/hrd/owner)' })
  createSalaryComponent(@Body() body: CreateSalaryComponentDto) {
    return this.payrollService.createSalaryComponent(body);
  }

  @Patch('salary-components/:id')
  @Roles('admin', 'hrd', 'owner')
  @ApiOperation({ summary: 'Perbarui komponen gaji (admin/hrd/owner)' })
  updateSalaryComponent(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateSalaryComponentDto,
  ) {
    return this.payrollService.updateSalaryComponent(id, body);
  }

  @Delete('salary-components/:id')
  @Roles('admin', 'hrd', 'owner')
  @ApiOperation({ summary: 'Nonaktifkan komponen gaji (admin/hrd/owner)' })
  deactivateSalaryComponent(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.deactivateSalaryComponent(id);
  }

  @Post('generate')
  @Roles('admin', 'hrd', 'owner')
  @ApiOperation({
    summary: 'Generate gaji periode bulan/tahun (admin/hrd/owner)',
  })
  generate(@Body() body: GeneratePayrollDto) {
    return this.payrollService.generate(body);
  }

  @Get('my')
  @ApiOperation({ summary: 'Slip gaji saya (pagination, filter bulan/tahun)' })
  myList(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe()) query: PayrollQueryDto,
  ) {
    return this.payrollService.myList(user.employeeId, query);
  }

  @Get('my/:id')
  @ApiOperation({ summary: 'Detail slip gaji saya' })
  myDetail(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.payrollService.myDetail(user.employeeId, id);
  }

  @Get()
  @Roles('admin', 'hrd', 'owner')
  @ApiOperation({
    summary: 'Semua slip gaji (admin/hrd/owner, filter periode/status)',
  })
  list(@Query(new ZodValidationPipe()) query: PayrollQueryDto) {
    return this.payrollService.list(query);
  }

  @Get(':id')
  @Roles('admin', 'hrd', 'owner')
  @ApiOperation({ summary: 'Detail slip gaji (admin/hrd/owner)' })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.detail(id);
  }

  @Post('approve')
  @Roles('admin', 'hrd', 'owner')
  @ApiOperation({ summary: 'Approve slip gaji terpilih (draft → approved)' })
  async approve(@CurrentUser() user: AuthUser, @Body() body: ApprovePayrollDto) {
    const result = await this.payrollService.batchApprove(user.employeeId, body);
    await this.auditLogsService.record({
      action: 'approve',
      resource: 'payroll',
      payload: {
        payrollIds: body.payPeriods.map((p) => p.payrollId),
        payrollNumbers: result.map((r) => r.payrollNumber),
      },
      userId: user.id,
      username: user.username,
    });
    return result;
  }

  @Post('mark-paid')
  @Roles('admin', 'hrd', 'owner')
  @ApiOperation({ summary: 'Tandai dibayar (approved → paid)' })
  async markPaid(@CurrentUser() user: AuthUser, @Body() body: MarkPaidDto) {
    const result = await this.payrollService.markPaid(body);
    await this.auditLogsService.record({
      action: 'mark-paid',
      resource: 'payroll',
      payload: {
        payrollIds: body.payrollIds,
        payrollNumbers: result.map((r) => r.payrollNumber),
      },
      userId: user.id,
      username: user.username,
    });
    return result;
  }

  @Get('my/:id/payslip')
  @ApiOperation({ summary: 'Unduh slip gaji saya dalam PDF' })
  async myPayslipPdf(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payroll = await this.payrollService.myDetail(user.employeeId, id);
    return this.streamPayslip(
      res,
      id,
      payroll.payrollNumber,
      payroll.employeeName,
    );
  }

  @Get(':id/payslip')
  @Roles('admin', 'hrd', 'owner')
  @ApiOperation({ summary: 'Unduh slip gaji PDF (admin/hrd/owner)' })
  async payslipPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payroll = await this.payrollService.detail(id);
    return this.streamPayslip(
      res,
      id,
      payroll.payrollNumber,
      payroll.employeeName,
    );
  }

  private async streamPayslip(
    res: Response,
    payrollId: number,
    payrollNumber: string,
    employeeName: string,
  ): Promise<StreamableFile> {
    const data = await this.payslipPdfService.loadPayroll(payrollId);
    const doc = this.payslipPdfService.generatePdf(data);
    const stream = this.payslipPdfService.streamPdf(doc);
    const safeName = employeeName
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '_');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="payslip_${safeName}_${payrollNumber}.pdf"`,
    });
    return new StreamableFile(stream);
  }
}
