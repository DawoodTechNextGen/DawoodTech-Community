export declare class UploadsService {
    saveImage(file: {
        mimetype: string;
        size: number;
        buffer: Buffer;
        originalname: string;
    }, subfolder: 'posts' | 'avatars'): Promise<string>;
}
