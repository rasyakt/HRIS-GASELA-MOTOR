import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@gasela/shared-types';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary:
      'Ringkasan dashboard per role (employee/manager/admin) — kehadiran hari ini, saldo cuti, persetujuan pending, statistik perusahaan',
  })
  summary(@CurrentUser() user: AuthUser) {
    return this.dashboardService.summary(user);
  }
}
