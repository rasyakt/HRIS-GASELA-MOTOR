import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import type {
  AttendanceReportQueryDto,
  LeaveReportQueryDto,
  PayrollReportQueryDto,
} from './dto/report-query.dto';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private streamCsv(
    res: Response,
    result: { filename: string; content: string },
  ): StreamableFile {
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    return new StreamableFile(Buffer.from(result.content, 'utf-8'), {
      type: 'text/csv; charset=utf-8',
    });
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Export laporan kehadiran (CSV)' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async attendance(
    @Query(new ZodValidationPipe()) query: AttendanceReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.reportsService.attendanceReport(query);
    return this.streamCsv(res, result);
  }

  @Get('leave')
  @ApiOperation({ summary: 'Export laporan cuti (CSV)' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async leave(
    @Query(new ZodValidationPipe()) query: LeaveReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.reportsService.leaveReport(query);
    return this.streamCsv(res, result);
  }

  @Get('payroll')
  @ApiOperation({ summary: 'Export laporan gaji (CSV)' })
  @Roles('admin', 'hrd', 'owner')
  async payroll(
    @Query(new ZodValidationPipe()) query: PayrollReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.reportsService.payrollReport(query);
    return this.streamCsv(res, result);
  }

  @Get('attendance/preview')
  @ApiOperation({ summary: 'Preview data laporan kehadiran (JSON)' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async attendancePreview(
    @Query(new ZodValidationPipe()) query: AttendanceReportQueryDto,
  ) {
    return this.reportsService.attendancePreview(query);
  }

  @Get('leave/preview')
  @ApiOperation({ summary: 'Preview data laporan cuti (JSON)' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async leavePreview(
    @Query(new ZodValidationPipe()) query: LeaveReportQueryDto,
  ) {
    return this.reportsService.leavePreview(query);
  }

  @Get('payroll/preview')
  @ApiOperation({ summary: 'Preview data laporan gaji (JSON)' })
  @Roles('admin', 'hrd', 'owner')
  async payrollPreview(
    @Query(new ZodValidationPipe()) query: PayrollReportQueryDto,
  ) {
    return this.reportsService.payrollPreview(query);
  }
}
