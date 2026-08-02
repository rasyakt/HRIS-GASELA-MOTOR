import type { ZodSchema } from 'zod';

export interface ZodDtoClass {
  new (): object;
  schema: ZodSchema;
}

export function createZodDto(schema: ZodSchema): ZodDtoClass {
  class ZodDto {}
  Object.defineProperty(ZodDto, 'schema', { value: schema, writable: false });
  return ZodDto as unknown as ZodDtoClass;
}
