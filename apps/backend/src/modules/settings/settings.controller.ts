import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SettingsService } from './settings.service';
import type { AuthUser } from '@gasela/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateHolidayDto,
  HolidayQueryDto,
  UpdateCompanySettingDto,
  UpdateHolidayDto,
} from './dto/settings.dto';

@ApiTags('Pengaturan')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Roles('admin', 'hrd', 'owner')
  @Get('company')
  @ApiOperation({ summary: 'Semua pengaturan perusahaan (admin/hrd/owner)' })
  listCompanySettings() {
    return this.settingsService.listCompanySettings();
  }

  @Roles('admin', 'hrd')
  @Put('company')
  @ApiOperation({
    summary: 'Perbarui satu pengaturan perusahaan (admin/hrd/superadmin)',
  })
  updateCompanySetting(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateCompanySettingDto,
  ) {
    return this.settingsService.updateCompanySetting(body, user);
  }

  @Roles('admin', 'hrd')
  @Get('holidays')
  @ApiOperation({ summary: 'Daftar hari libur per tahun (admin/hrd)' })
  listHolidays(@Query(new ZodValidationPipe()) query: HolidayQueryDto) {
    return this.settingsService.listHolidays(query);
  }

  @Roles('admin', 'hrd')
  @Post('holidays')
  @ApiOperation({ summary: 'Tambah hari libur (admin/hrd)' })
  createHoliday(@Body() body: CreateHolidayDto) {
    return this.settingsService.createHoliday(body);
  }

  @Roles('admin', 'hrd')
  @Patch('holidays/:id')
  @ApiOperation({ summary: 'Perbarui hari libur (admin/hrd)' })
  updateHoliday(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHolidayDto,
  ) {
    return this.settingsService.updateHoliday(id, body);
  }

  @Roles('admin', 'hrd')
  @Delete('holidays/:id')
  @ApiOperation({ summary: 'Hapus hari libur (admin/hrd)' })
  removeHoliday(@Param('id', ParseIntPipe) id: number) {
    return this.settingsService.removeHoliday(id);
  }
}
