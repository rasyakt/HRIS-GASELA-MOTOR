import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class WinstonLoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Transport for rotating file logs
    const fileRotateTransport = new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d', // Keep logs for 30 days
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    });

    // Transport for error logs
    const errorFileTransport = new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    });

    // Transport for security logs
    const securityFileTransport = new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d', // Keep security logs for 90 days
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    });

    const transports: winston.transport[] = [
      fileRotateTransport,
      errorFileTransport,
    ];

    // Console transport for development
    if (isDevelopment) {
      transports.push(
        new winston.transports.Console({
          level: logLevel,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              let msg = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
              if (Object.keys(meta).length > 0) {
                msg += ` ${JSON.stringify(meta)}`;
              }
              return msg;
            }),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports,
      exceptionHandlers: [
        new DailyRotateFile({
          filename: 'logs/exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          filename: 'logs/rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
    });

    // Add security logger
    this.logger.add(securityFileTransport);
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  /**
   * Log security-related events
   */
  security(event: string, details: Record<string, any>) {
    this.logger.info(event, {
      context: 'Security',
      type: 'security_event',
      ...details,
    });
  }

  /**
   * Log failed login attempts
   */
  failedLogin(username: string, ip: string, reason: string) {
    this.security('FAILED_LOGIN', {
      username,
      ip,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log successful logins
   */
  successfulLogin(username: string, ip: string, userId: number) {
    this.security('SUCCESSFUL_LOGIN', {
      username,
      ip,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log account lockouts
   */
  accountLocked(username: string, ip: string, lockUntil: Date) {
    this.security('ACCOUNT_LOCKED', {
      username,
      ip,
      lockUntil: lockUntil.toISOString(),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log unauthorized access attempts
   */
  unauthorizedAccess(userId: number | null, resource: string, ip: string) {
    this.security('UNAUTHORIZED_ACCESS', {
      userId,
      resource,
      ip,
      timestamp: new Date().toISOString(),
    });
  }
}
