import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@gasela/shared-types';
import { AttendancesService } from './attendances.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AttendanceQueryDto,
  CheckInDto,
  CheckOutDto,
} from './dto/attendance.dto';

@ApiTags('Kehadiran')
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Check-in (validasi geofence kantor)' })
  checkIn(@CurrentUser() user: AuthUser, @Body() body: CheckInDto) {
    return this.attendancesService.checkIn(user.employeeId, body);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Check-out (validasi geofence kantor)' })
  checkOut(@CurrentUser() user: AuthUser, @Body() body: CheckOutDto) {
    return this.attendancesService.checkOut(user.employeeId, body);
  }

  @Get('my')
  @ApiOperation({
    summary: 'Riwayat kehadiran saya (pagination & rentang tanggal)',
  })
  my(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe()) query: AttendanceQueryDto,
  ) {
    return this.attendancesService.myAttendance(user.employeeId, query);
  }

  @Roles('admin', 'hrd')
  @Get()
  @ApiOperation({
    summary: 'Semua kehadiran (admin/hrd, filter karyawan/tanggal)',
  })
  list(@Query(new ZodValidationPipe()) query: AttendanceQueryDto) {
    return this.attendancesService.list(query);
  }
}
