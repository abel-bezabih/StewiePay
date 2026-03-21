import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private configService;
    constructor(configService: ConfigService);
    /**
     * Upload image to Cloudinary
     * @param base64Image - Base64 encoded image string (with or without data URI prefix)
     * @param folder - Optional folder path in Cloudinary
     * @returns Promise with the uploaded image URL
     */
    uploadImage(base64Image: string, folder?: string): Promise<string>;
    /**
     * Delete image from Cloudinary
     * @param imageUrl - Full URL of the image to delete
     */
    deleteImage(imageUrl: string): Promise<void>;
}
