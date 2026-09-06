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
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@gasela/shared-types';
import { EmployeesService } from './employees.service';
import { EmployeeImportService } from './employee-import.service';
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
    private readonly employeeImportService: EmployeeImportService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Roles('admin', 'hrd', 'manager', 'owner')
  @Get()
  @ApiOperation({ summary: 'Daftar karyawan (pagination & filter)' })
  list(@Query(new ZodValidationPipe()) query: EmployeeQueryDto) {
    return this.employeesService.list(query);
  }

  @Roles('admin', 'hrd', 'owner')
  @Get('next-number')
  @ApiOperation({ summary: 'Dapatkan nomor karyawan (NIK) berikutnya sesuai format aktif' })
  getNextNumber() {
    return this.employeesService.getNextEmployeeNumber();
  }

  @Roles('admin', 'hrd', 'owner')
  @Get('import/template')
  @ApiOperation({ summary: 'Unduh template resmi import karyawan Excel (.xlsx)' })
  async downloadImportTemplate(@Res() res: Response) {
    const buffer = await this.employeeImportService.generateTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Template_Import_Karyawan_Gasela.xlsx"',
    );
    res.send(buffer);
  }

  @Roles('admin', 'hrd', 'owner')
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 }, // Maksimal 20MB
      fileFilter: (_req, file, callback) => {
        const allowedExtensions = /\.(xlsx|xls)$/i;
        const allowedMimetypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream',
        ];
        if (!file.originalname.match(allowedExtensions)) {
          return callback(
            new BadRequestException(
              'Format file tidak didukung. Hanya file spreadsheet Excel (.xlsx, .xls) yang diperbolehkan.',
            ),
            false,
          );
        }
        if (
          !allowedMimetypes.includes(file.mimetype) &&
          !file.originalname.match(allowedExtensions)
        ) {
          return callback(
            new BadRequestException(
              'Tipe MIME file tidak valid untuk spreadsheet Excel.',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Import data karyawan dari file Excel (.xlsx, .xls)' })
  async importEmployees(
    @UploadedFile() file: Express.Multer.File,
    @Body('autoCreateAccounts') autoCreateAccounts: string | boolean | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('File Excel wajib diunggah.');
    }
    const shouldCreateAccounts =
      autoCreateAccounts === undefined ||
      autoCreateAccounts === true ||
      autoCreateAccounts === 'true';

    const result = await this.employeeImportService.importFromExcel(file.buffer, {
      autoCreateAccounts: shouldCreateAccounts,
    });

    await this.auditLogsService.record({
      userId: user.id,
      username: user.username,
      action: 'IMPORT',
      resource: 'employees',
      payload: {
        totalRows: result.totalRows,
        successCount: result.successCount,
        failedCount: result.failedCount,
        autoCreateAccounts: shouldCreateAccounts,
        filename: file.originalname,
      },
    });

    return result;
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
  create(@Body(new ZodValidationPipe()) body: CreateEmployeeDto) {
    return this.employeesService.create(body);
  }

  @Roles('admin', 'hrd')
  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui data karyawan (admin/hrd)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe()) body: UpdateEmployeeDto,
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
