import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
  CreateFamilyMemberDto,
  UpdateFamilyMemberDto,
} from './dto/employee.dto';

@ApiTags('Karyawan')
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Roles('admin', 'hrd', 'manager', 'owner')
  @Get()
  @ApiOperation({ summary: 'Daftar karyawan (pagination & filter)' })
  list(@Query(new ZodValidationPipe()) query: EmployeeQueryDto) {
    return this.employeesService.list(query);
  }

  @Roles('admin', 'hrd', 'manager', 'owner', 'employee')
  @Get(':id')
  @ApiOperation({ summary: 'Detail karyawan' })
  getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    // Authorization moved to service layer for better security
    return this.employeesService.getById(id, user);
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
    const result = await this.employeesService.update(id, body, user);
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
    const result = await this.employeesService.deactivate(id, user);
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
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) body: CreateUserAccountDto,
  ) {
    return this.employeesService.createAccount(id, body, user);
  }

  @Roles('admin')
  @Patch(':id/account')
  @ApiOperation({ summary: 'Perbarui akun login karyawan (hanya admin)' })
  updateAccount(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) body: UpdateUserAccountDto,
  ) {
    return this.employeesService.updateAccount(id, body, user);
  }

  @Roles('admin')
  @Post(':id/account/reset-password')
  @ApiOperation({ summary: 'Reset password akun karyawan (hanya admin)' })
  async resetPassword(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) body: ResetUserPasswordDto,
  ) {
    await this.employeesService.resetPassword(id, body, user);
    return { message: 'Password berhasil direset' };
  }

  @Roles('admin', 'hrd')
  @Post(':id/family')
  @ApiOperation({ summary: 'Tambah anggota keluarga karyawan' })
  addFamilyMember(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) body: CreateFamilyMemberDto,
  ) {
    return this.employeesService.addFamilyMember(id, body);
  }

  @Roles('admin', 'hrd')
  @Patch(':id/family/:familyId')
  @ApiOperation({ summary: 'Perbarui data anggota keluarga karyawan' })
  updateFamilyMember(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Body(new ZodValidationPipe()) body: UpdateFamilyMemberDto,
  ) {
    return this.employeesService.updateFamilyMember(familyId, body);
  }

  @Roles('admin', 'hrd')
  @Delete(':id/family/:familyId')
  @ApiOperation({ summary: 'Hapus data anggota keluarga karyawan' })
  deleteFamilyMember(@Param('familyId', ParseIntPipe) familyId: number) {
    return this.employeesService.deleteFamilyMember(familyId);
  }
}
