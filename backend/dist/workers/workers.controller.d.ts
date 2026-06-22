import { Request } from 'express';
import { UserProfile } from '../auth/interfaces/user.interface';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkersService } from './workers.service';
export declare class WorkersController {
    private workersService;
    constructor(workersService: WorkersService);
    findAll(activo?: string): Promise<import("./interfaces/worker.interface").Worker[]>;
    findMe(req: Request & {
        user: UserProfile;
    }): Promise<{
        worker_id: string | null;
    }>;
    findOne(id: string): Promise<import("./interfaces/worker.interface").Worker>;
    create(dto: CreateWorkerDto): Promise<import("./interfaces/worker.interface").Worker>;
    resendInvitation(id: string): Promise<{
        mensaje: string;
    }>;
    update(id: string, dto: UpdateWorkerDto): Promise<import("./interfaces/worker.interface").Worker>;
    remove(id: string): Promise<{
        mensaje: string;
    }>;
}
