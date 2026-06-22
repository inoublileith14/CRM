import { StorageService } from './storage.service';
export declare class StorageController {
    private storageService;
    constructor(storageService: StorageService);
    upload(file: Express.Multer.File): Promise<{
        url: string;
        path: string;
    }>;
}
