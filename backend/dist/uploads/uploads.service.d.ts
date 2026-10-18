export declare const MAX_UPLOAD_BYTES: number;
export declare class UploadsService {
    saveImage(file: {
        size: number;
        buffer: Buffer;
    }, subfolder: 'posts' | 'avatars'): Promise<string>;
}
