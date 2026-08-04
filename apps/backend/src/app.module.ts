import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { PositionsModule } from './modules/positions/positions.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { AttendancesModule } from './modules/attendances/attendances.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { OvertimeModule } from './modules/overtime/overtime.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { PerformanceReviewsModule } from './modules/performance-reviews/performance-reviews.module';
import { TrainingRecordsModule } from './modules/training-records/training-records.module';
import { AssetAssignmentsModule } from './modules/asset-assignments/asset-assignments.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { WarningLettersModule } from './modules/warning-letters/warning-letters.module';
import { validateEnv } from './config/configuration';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000,   // 1 menit
        limit: 120,    // 120 req/menit per IP (endpoint biasa)
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    DepartmentsModule,
    PositionsModule,
    EmployeesModule,
    ShiftsModule,
    AttendancesModule,
    LeavesModule,
    OvertimeModule,
    DashboardModule,
    PayrollModule,
    AnnouncementsModule,
    NotificationsModule,
    SettingsModule,
    UploadsModule,
    ReportsModule,
    DocumentsModule,
    PerformanceReviewsModule,
    TrainingRecordsModule,
    AssetAssignmentsModule,
    AuditLogsModule,
    WarningLettersModule,
  ],
  providers: [
    // Rate limiting global — override per-controller/handler pakai @Throttle()
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
