import { ApiProperty } from '@nestjs/swagger';
import { updateLandingSectionSchema } from '@gasela/shared-types';
import { createZodDto } from '../../../common/dto/create-zod-dto';

export class UpdateLandingSectionDto extends createZodDto(
  updateLandingSectionSchema,
) {
  @ApiProperty({
    description: 'Override parsial/lengkap konten section',
    additionalProperties: {
      description: 'Nilai field mana pun pada skema section',
    },
  })
  declare content: Record<string, unknown>;
}
