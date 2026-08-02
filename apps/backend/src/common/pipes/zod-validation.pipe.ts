import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';

export interface ZodDtoLike {
  schema: ZodSchema;
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    const schema = (metadata.metatype as ZodDtoLike | undefined)?.schema;
    if (!schema) return value;
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validasi input gagal',
        errors: result.error.flatten(),
      });
    }
    return result.data as unknown;
  }
}
