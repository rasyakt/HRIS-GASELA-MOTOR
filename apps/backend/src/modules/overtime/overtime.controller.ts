import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@gasela/shared-types';
import { OvertimeService } from './overtime.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  CreateOvertimeDto,
  DecideOvertimeDto,
  OvertimeQueryDto,
} from './dto/overtime.dto';

@ApiTags('Lembur')
@Controller('overtime')
export class OvertimeController {
  constructor(
    private readonly overtimeService: OvertimeService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post('requests')
  @ApiOperation({ summary: 'Ajukan lembur (untuk diri sendiri)' })
  createRequest(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateOvertimeDto,
  ) {
    return this.overtimeService.createRequest(user.employeeId, body);
  }

  @Get('requests/my')
  @ApiOperation({ summary: 'Pengajuan lembur saya (pagination)' })
  myRequests(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe()) query: OvertimeQueryDto,
  ) {
    return this.overtimeService.myRequests(user.employeeId, query);
  }

  @Roles('admin', 'hrd', 'manager')
  @Get('requests')
  @ApiOperation({
    summary:
      'Semua pengajuan lembur (admin/hrd/manager, filter status/karyawan)',
  })
  listRequests(@Query(new ZodValidationPipe()) query: OvertimeQueryDto) {
    return this.overtimeService.listRequests(query);
  }

  @Roles('admin', 'hrd', 'manager')
  @Post('requests/:id/decide')
  @ApiOperation({ summary: 'Approve/tolak pengajuan (admin/hrd/manager)' })
  async decide(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() body: DecideOvertimeDto,
  ) {
    const result = await this.overtimeService.decide(id, user.employeeId, body);
    await this.auditLogsService.record({
      action: body.status === 'approved' ? 'approve' : 'reject',
      resource: 'overtime-request',
      resourceId: id,
      payload: { requestNumber: result.requestNumber },
      userId: user.id,
      username: user.username,
    });
    return result;
  }

  @Post('requests/:id/cancel')
  @ApiOperation({ summary: 'Batalkan pengajuan sendiri (status pending)' })
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.overtimeService.cancel(id, user.employeeId);
  }
}
