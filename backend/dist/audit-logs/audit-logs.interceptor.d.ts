import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditLogsService } from './audit-logs.service';
export declare class AuditLogsInterceptor implements NestInterceptor {
    private auditLogs;
    constructor(auditLogs: AuditLogsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
