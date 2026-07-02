import { Request } from 'express';
import { UserProfile } from '../auth/interfaces/user.interface';
import { AuditLogsService } from './audit-logs.service';
export declare class AuditLogsController {
    private auditLogs;
    constructor(auditLogs: AuditLogsService);
    list(req: Request & {
        user: UserProfile;
    }, limit?: string): Promise<unknown[]>;
}
