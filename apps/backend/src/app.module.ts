import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { PositionsModule } from './modules/positions/positions.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { AttendancesModule } from './modules/attendances/attendances.module';
import { validateEnv } from './config/configuration';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [configuration],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    DepartmentsModule,
    PositionsModule,
    EmployeesModule,
    ShiftsModule,
    AttendancesModule,
  ],
})
export class AppModule {}
