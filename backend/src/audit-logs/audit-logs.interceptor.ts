import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import type { Request } from 'express';
import { AuditLogsService } from './audit-logs.service';
import { UserProfile } from '../auth/interfaces/user.interface';

function isMutation(method: string): boolean {
  return method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';
}

function pickEntity(req: Request): { entity_type?: string; entity_id?: string } {
  // best-effort mapping for the most common routes
  const path = (req.baseUrl || '') + (req.path || '');
  const params = req.params ?? {};

  if (path.startsWith('/inmuebles')) {
    return { entity_type: 'inmueble', entity_id: (params as any).id ?? (params as any).inmuebleId };
  }
  if (path.startsWith('/clientes')) {
    return { entity_type: 'cliente', entity_id: (params as any).id ?? (params as any).clienteId };
  }
  if (path.startsWith('/workers')) {
    return { entity_type: 'worker', entity_id: (params as any).id ?? undefined };
  }
  if (path.startsWith('/propietarios')) {
    return { entity_type: 'propietario', entity_id: (params as any).id ?? undefined };
  }
  if (path.startsWith('/whatsapp')) {
    return { entity_type: 'whatsapp', entity_id: (params as any).id ?? undefined };
  }
  return {};
}

@Injectable()
export class AuditLogsInterceptor implements NestInterceptor {
  constructor(private auditLogs: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: UserProfile }>();
    const res = http.getResponse<{ statusCode?: number }>();

    const method = (req.method || '').toUpperCase();
    if (!isMutation(method)) return next.handle();

    // avoid logging auth endpoints or health checks
    const fullPath = (req.baseUrl || '') + (req.path || '');
    if (fullPath.startsWith('/auth')) return next.handle();
    if (fullPath === '/' || fullPath.startsWith('/chat')) return next.handle();

    const user = req.user;
    const start = Date.now();
    const entity = pickEntity(req);

    return next.handle().pipe(
      finalize(() => {
        const statusCode = (res as any)?.statusCode ?? undefined;
        const duration_ms = Date.now() - start;

        void this.auditLogs.create({
          actor_id: user?.id ?? null,
          actor_nombre: (user as any)?.nombre ?? null,
          actor_rol: (user as any)?.rol ?? null,
          action: `${method} ${fullPath}`,
          entity_type: entity.entity_type ?? null,
          entity_id: entity.entity_id ?? null,
          route: fullPath,
          method,
          status_code: typeof statusCode === 'number' ? statusCode : null,
          metadata: {
            params: req.params ?? {},
            duration_ms,
          },
        });
      }),
    );
  }
}

