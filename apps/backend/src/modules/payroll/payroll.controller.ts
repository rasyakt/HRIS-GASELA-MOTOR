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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@gasela/shared-types';
import { PayrollService } from './payroll.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
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
  constructor(private readonly payrollService: PayrollService) {}

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
  @ApiOperation({ summary: 'Generate gaji periode bulan/tahun (admin/hrd/owner)' })
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
  @ApiOperation({ summary: 'Semua slip gaji (admin/hrd/owner, filter periode/status)' })
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
  approve(
    @CurrentUser() user: AuthUser,
    @Body() body: ApprovePayrollDto,
  ) {
    return this.payrollService.batchApprove(user.employeeId, body);
  }

  @Post('mark-paid')
  @Roles('admin', 'hrd', 'owner')
  @ApiOperation({ summary: 'Tandai dibayar (approved → paid)' })
  markPaid(@Body() body: MarkPaidDto) {
    return this.payrollService.markPaid(body);
  }
}
