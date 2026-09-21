import { UploadsService } from './uploads.service.js';
export declare class UploadsController {
    private readonly uploads;
    constructor(uploads: UploadsService);
    uploadImage(file?: Express.Multer.File): Promise<{
        url: string;
    }>;
}
