import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CompanySettingDto,
  CreateHolidayInput,
  HolidayQuery,
  UpdateCompanySettingInput,
  UpdateHolidayInput,
} from '@gasela/shared-types';
import {
  createHolidaySchema,
  holidayQuerySchema,
  updateCompanySettingSchema,
  updateHolidaySchema,
} from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class UpdateCompanySettingDto
  extends createZodDto(updateCompanySettingSchema)
  implements UpdateCompanySettingInput
{
  @ApiProperty({
    enum: [
      'company.name',
      'office.location',
      'office.radius_meters',
      'bpjs.rates',
      'overtime.rate_multiplier_weekday',
    ] as const,
  })
  key: UpdateCompanySettingInput['key'];
  @ApiProperty({
    example: '{"kes":4,"jht":2,"jp":1,"kecelakaan":0.24,"kematian":0.3}',
  })
  value: string;
}

export class CompanySettingDtoImpl implements CompanySettingDto {
  @ApiProperty()
  key: string;
  @ApiProperty()
  value: string;
  @ApiProperty({ nullable: true })
  description: string | null;
  @ApiProperty()
  updatedAt: string;
}

export class HolidayQueryDto
  extends createZodDto(holidayQuerySchema)
  implements HolidayQuery
{
  @ApiPropertyOptional({ example: 2026 })
  year?: number;
  @ApiPropertyOptional({ example: 8 })
  month?: number;
}

export class CreateHolidayDto
  extends createZodDto(createHolidaySchema)
  implements CreateHolidayInput
{
  @ApiProperty({ example: '2026-08-17' })
  date: string;
  @ApiProperty({ example: 'Hari Kemerdekaan RI' })
  name: string;
  @ApiPropertyOptional({ default: false })
  isRecurringYearly: boolean;
}

export class UpdateHolidayDto
  extends createZodDto(updateHolidaySchema)
  implements UpdateHolidayInput
{
  @ApiPropertyOptional({ example: '2026-08-17' })
  date?: string;
  @ApiPropertyOptional({ example: 'Hari Kemerdekaan RI' })
  name?: string;
  @ApiPropertyOptional()
  isRecurringYearly?: boolean;
}
