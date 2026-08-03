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
import { EmployeesService } from './employees.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  CreateEmployeeDto,
  EmployeeQueryDto,
  UpdateEmployeeDto,
  CreateUserAccountDto,
  UpdateUserAccountDto,
  ResetUserPasswordDto,
} from './dto/employee.dto';

@ApiTags('Karyawan')
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Roles('admin', 'hrd', 'manager')
  @Get()
  @ApiOperation({ summary: 'Daftar karyawan (pagination & filter)' })
  list(@Query(new ZodValidationPipe()) query: EmployeeQueryDto) {
    return this.employeesService.list(query);
  }

  @Roles('admin', 'hrd', 'manager')
  @Get(':id')
  @ApiOperation({ summary: 'Detail karyawan' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.getById(id);
  }

  @Roles('admin', 'hrd')
  @Post()
  @ApiOperation({ summary: 'Buat karyawan baru (admin/hrd)' })
  create(@Body() body: CreateEmployeeDto) {
    return this.employeesService.create(body);
  }

  @Roles('admin', 'hrd')
  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui data karyawan (admin/hrd)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateEmployeeDto,
  ) {
    const result = await this.employeesService.update(id, body);
    if (body.basicSalary !== undefined) {
      await this.auditLogsService.record({
        action: 'edit-salary',
        resource: 'employee',
        resourceId: id,
        payload: { basicSalary: body.basicSalary },
        userId: user.id,
        username: user.username,
      });
    }
    return result;
  }

  @Roles('admin', 'hrd')
  @Delete(':id')
  @ApiOperation({ summary: 'Nonaktifkan karyawan (admin/hrd, soft delete)' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.employeesService.deactivate(id);
    await this.auditLogsService.record({
      action: 'deactivate',
      resource: 'employee',
      resourceId: id,
      userId: user.id,
      username: user.username,
    });
    return result;
  }

  @Roles('admin')
  @Post(':id/account')
  @ApiOperation({ summary: 'Buat akun login karyawan (hanya admin)' })
  createAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) body: CreateUserAccountDto,
  ) {
    return this.employeesService.createAccount(id, body);
  }

  @Roles('admin')
  @Patch(':id/account')
  @ApiOperation({ summary: 'Perbarui akun login karyawan (hanya admin)' })
  updateAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) body: UpdateUserAccountDto,
  ) {
    return this.employeesService.updateAccount(id, body);
  }

  @Roles('admin')
  @Post(':id/account/reset-password')
  @ApiOperation({ summary: 'Reset password akun karyawan (hanya admin)' })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) body: ResetUserPasswordDto,
  ) {
    await this.employeesService.resetPassword(id, body);
    return { message: 'Password berhasil direset' };
  }
}
