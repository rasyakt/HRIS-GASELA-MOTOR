import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';

export interface SystemErrorLogItem {
  id: string;
  timestamp: string;
  statusCode: number;
  method: string;
  path: string;
  error: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
  username?: string;
  stack?: string;
}

export const SYSTEM_ERROR_LOGS: SystemErrorLogItem[] = [];
const MAX_ERROR_LOGS = 100;

export function recordSystemError(
  entry: Omit<SystemErrorLogItem, 'id' | 'timestamp'>,
) {
  const log: SystemErrorLogItem = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  SYSTEM_ERROR_LOGS.unshift(log);
  if (SYSTEM_ERROR_LOGS.length > MAX_ERROR_LOGS) {
    SYSTEM_ERROR_LOGS.pop();
  }
}

export function getSystemErrorLogs(limit = 15): SystemErrorLogItem[] {
  return SYSTEM_ERROR_LOGS.slice(0, Math.min(limit, 50));
}

export function clearSystemErrorLogs(): void {
  SYSTEM_ERROR_LOGS.length = 0;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const resObj = exceptionResponse as Record<string, any>;
      message = resObj.message || message;
      error = resObj.error || error;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const formattedMessage = Array.isArray(message)
      ? message.join(', ')
      : message;

    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error on ${request.method} ${request.url}: ${
          exception instanceof Error ? exception.stack : String(exception)
        }`,
      );
    }

    const user = (request as any).user;
    const username =
      user?.username || (user?.email ? user.email.split('@')[0] : undefined);
    const ipAddress =
      request.ip ||
      (request.headers['x-forwarded-for'] as string) ||
      request.socket?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    if (status >= 400) {
      recordSystemError({
        statusCode: status,
        method: request.method,
        path: request.url,
        error,
        message: formattedMessage,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
        userAgent: typeof userAgent === 'string' ? userAgent : undefined,
        username,
        stack:
          status >= 500 && exception instanceof Error
            ? exception.stack
            : undefined,
      });
    }

    response.status(status).json({
      statusCode: status,
      error,
      message: formattedMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
