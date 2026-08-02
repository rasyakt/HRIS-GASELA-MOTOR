import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthRequest } from '../types/auth-request.type';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthRequest>().user,
);
