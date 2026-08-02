import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateEmployeeDto,
  EmployeeQueryDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';

@ApiTags('Karyawan')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Roles('admin', 'hrd', 'manager')
  @Get()
  @ApiOperation({ summary: 'Daftar karyawan (pagination & filter)' })
  list(@Query(new ZodValidationPipe()) query: EmployeeQueryDto) {
    return this.employeesService.list(query);
  }

  @Roles('admin', 'hrd', 'manager')
  @Get(':id')
  @ApiOperation({ summary: 'Detail karyawan' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.getById(id);
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, body);
  }

  @Roles('admin', 'hrd')
  @Delete(':id')
  @ApiOperation({ summary: 'Nonaktifkan karyawan (admin/hrd, soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.deactivate(id);
  }
}
