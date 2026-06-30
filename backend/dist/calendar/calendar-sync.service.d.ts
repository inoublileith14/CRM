import type { Response } from 'express';
export declare class CalendarSyncService {
    private readonly logger;
    private readonly subscribers;
    addSubscriber(userId: string, res: Response): () => void;
    notifyUser(userId: string): void;
    private removeSubscriber;
}
