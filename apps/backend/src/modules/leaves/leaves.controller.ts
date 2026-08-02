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
import type { AuthUser } from '@gasela/shared-types';
import { LeavesService } from './leaves.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  BalanceQueryDto,
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  DecideLeaveDto,
  LeaveQueryDto,
  UpdateLeaveTypeDto,
} from './dto/leave.dto';

@ApiTags('Cuti')
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get('types')
  @ApiOperation({ summary: 'Daftar jenis cuti (opsi includeInactive)' })
  listTypes(@Query('includeInactive') includeInactive?: string) {
    return this.leavesService.listTypes(includeInactive === 'true');
  }

  @Roles('admin', 'hrd')
  @Post('types')
  @ApiOperation({ summary: 'Buat jenis cuti (admin/hrd)' })
  createType(@Body() body: CreateLeaveTypeDto) {
    return this.leavesService.createType(body);
  }

  @Roles('admin', 'hrd')
  @Patch('types/:id')
  @ApiOperation({ summary: 'Perbarui jenis cuti (admin/hrd)' })
  updateType(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLeaveTypeDto,
  ) {
    return this.leavesService.updateType(id, body);
  }

  @Roles('admin', 'hrd')
  @Delete('types/:id')
  @ApiOperation({ summary: 'Nonaktifkan jenis cuti (admin/hrd)' })
  deactivateType(@Param('id', ParseIntPipe) id: number) {
    return this.leavesService.deactivateType(id);
  }

  @Get('balances/my')
  @ApiOperation({ summary: 'Saldo cuti saya per tahun' })
  myBalances(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe()) query: BalanceQueryDto,
  ) {
    return this.leavesService.myBalances(user.employeeId, query);
  }

  @Roles('admin', 'hrd')
  @Get('balances')
  @ApiOperation({ summary: 'Semua saldo cuti (admin/hrd)' })
  listBalances(@Query(new ZodValidationPipe()) query: BalanceQueryDto) {
    return this.leavesService.listBalances(query);
  }

  @Post('requests')
  @ApiOperation({ summary: 'Ajukan cuti (untuk diri sendiri)' })
  createRequest(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateLeaveRequestDto,
  ) {
    return this.leavesService.createRequest(user.employeeId, body);
  }

  @Get('requests/my')
  @ApiOperation({ summary: 'Pengajuan cuti saya (pagination)' })
  myRequests(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe()) query: LeaveQueryDto,
  ) {
    return this.leavesService.myRequests(user.employeeId, query);
  }

  @Roles('admin', 'hrd', 'manager')
  @Get('requests')
  @ApiOperation({
    summary: 'Semua pengajuan cuti (admin/hrd/manager, filter status/karyawan)',
  })
  listRequests(@Query(new ZodValidationPipe()) query: LeaveQueryDto) {
    return this.leavesService.listRequests(query);
  }

  @Roles('admin', 'hrd', 'manager')
  @Post('requests/:id/decide')
  @ApiOperation({ summary: 'Approve/tolak pengajuan (admin/hrd/manager)' })
  decide(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() body: DecideLeaveDto,
  ) {
    return this.leavesService.decide(id, user.employeeId, body);
  }

  @Post('requests/:id/cancel')
  @ApiOperation({ summary: 'Batalkan pengajuan sendiri (status pending)' })
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.leavesService.cancel(id, user.employeeId);
  }
}
