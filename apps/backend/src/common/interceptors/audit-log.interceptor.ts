import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';
import type { Request } from 'express';
import type { AuthRequest } from '../../modules/auth/types/auth-request.type';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogs: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<AuthRequest>();

    // We only log mutating actions (POST, PUT, PATCH, DELETE)
    const method = req.method;
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap(() => {
        const user = req.user;
        if (isMutating && user) {
          this.logAction(req, user);
        }
      }),
    );
  }

  private logAction(req: AuthRequest, user: any) {
    const url = req.originalUrl || req.url;
    // Extract resource and action from originalUrl
    // E.g., /api/employees -> resource: employees
    // E.g., /api/leaves/requests -> resource: leaves
    const pathParts = url.split('?')[0].split('/').filter(Boolean);
    
    // remove 'api' prefix if present
    if (pathParts[0] === 'api') {
      pathParts.shift();
    }

    const resource = pathParts[0] || 'unknown';
    
    let action = 'action';
    if (req.method === 'POST') {
      if (pathParts.includes('approve') || url.includes('/approve')) {
        action = 'APPROVE';
      } else if (pathParts.includes('reject') || url.includes('/reject')) {
        action = 'REJECT';
      } else if (pathParts.includes('cancel') || url.includes('/cancel')) {
        action = 'CANCEL';
      } else if (pathParts.includes('publish') || url.includes('/publish')) {
        action = 'PUBLISH';
      } else if (pathParts.includes('mark-paid') || url.includes('/mark-paid')) {
        action = 'MARK_PAID';
      } else if (url.split('?')[0].endsWith('/auth/login')) {
        // BUG-020: Gunakan exact path match agar tidak false-match URL lain
        // yang mengandung kata 'login' (misal /social-login, /relogin, dll)
        action = 'LOGIN';
      } else {
        action = 'CREATE';
      }
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      action = 'UPDATE';
    } else if (req.method === 'DELETE') {
      action = 'DELETE';
    }

    // Extract resourceId if there is a number or id in path parts or params
    let resourceId: string | undefined = undefined;
    if (req.params && req.params.id) {
      resourceId = String(req.params.id);
    } else {
      // Find the last numeric part of pathParts
      for (let i = pathParts.length - 1; i >= 0; i--) {
        if (!isNaN(Number(pathParts[i]))) {
          resourceId = pathParts[i];
          break;
        }
      }
    }

    // Sanitize payload (mask passwords/tokens)
    const payload = req.body ? { ...req.body } : null;
    if (payload) {
      const sensitiveKeys = ['password', 'oldPassword', 'newPassword', 'token', 'accessToken', 'refreshToken'];
      for (const key of sensitiveKeys) {
        if (key in payload) {
          payload[key] = '********';
        }
      }
    }

    this.auditLogs.record({
      action,
      resource,
      resourceId,
      payload,
      userId: user.id,
      username: user.username,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {
      // Silently swallow errors during logging so we don't break the actual request
    });
  }
}
