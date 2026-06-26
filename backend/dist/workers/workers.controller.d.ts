import { Request } from 'express';
import { UserProfile } from '../auth/interfaces/user.interface';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkersService } from './workers.service';
export declare class WorkersController {
    private workersService;
    constructor(workersService: WorkersService);
    private assertAdmin;
    findAll(activo?: string): Promise<import("./interfaces/worker.interface").Worker[]>;
    findMe(req: Request & {
        user: UserProfile;
    }): Promise<{
        worker_id: string | null;
    }>;
    findOne(req: Request & {
        user: UserProfile;
    }, id: string): Promise<import("./interfaces/worker.interface").Worker>;
    create(req: Request & {
        user: UserProfile;
    }, dto: CreateWorkerDto): Promise<import("./interfaces/worker.interface").Worker>;
    resendInvitation(req: Request & {
        user: UserProfile;
    }, id: string): Promise<{
        mensaje: string;
    }>;
    update(req: Request & {
        user: UserProfile;
    }, id: string, dto: UpdateWorkerDto): Promise<import("./interfaces/worker.interface").Worker>;
    remove(req: Request & {
        user: UserProfile;
    }, id: string): Promise<{
        mensaje: string;
    }>;
}
