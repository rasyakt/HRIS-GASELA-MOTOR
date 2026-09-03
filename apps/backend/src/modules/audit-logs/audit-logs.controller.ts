import { Controller, Delete, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-log.dto';

@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Riwayat audit (admin/hrd/owner, pagination)' })
  @Roles('admin', 'hrd', 'owner')
  async list(@Query(new ZodValidationPipe()) query: AuditLogQueryDto) {
    return this.auditLogsService.list(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Ringkasan log (total & hari ini)' })
  @Roles('admin', 'hrd', 'owner')
  async stats() {
    return this.auditLogsService.stats();
  }

  @Get('error-logs')
  @ApiOperation({ summary: '15 log error sistem terbaru (superadmin/admin/owner)' })
  @Roles('superadmin', 'admin', 'owner')
  getErrorLogs(@Query('limit') limit?: string) {
    const lim = limit ? Math.min(Math.max(1, parseInt(limit, 10) || 15), 50) : 15;
    return this.auditLogsService.getRecentErrorLogs(lim);
  }

  @Delete('error-logs')
  @ApiOperation({ summary: 'Bersihkan log error sistem (superadmin)' })
  @Roles('superadmin')
  clearErrorLogs() {
    return this.auditLogsService.clearRecentErrorLogs();
  }
}
