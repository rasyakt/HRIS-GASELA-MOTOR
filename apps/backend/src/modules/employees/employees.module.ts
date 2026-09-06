import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { EmployeeImportService } from './employee-import.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeeImportService],
  exports: [EmployeesService, EmployeeImportService],
})
export class EmployeesModule {}
