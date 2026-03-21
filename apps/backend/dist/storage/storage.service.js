"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
const config_1 = require("@nestjs/config");
let StorageService = class StorageService {
    constructor(configService) {
        this.configService = configService;
        // Configure Cloudinary
        const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.configService.get('CLOUDINARY_API_KEY');
        const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');
        if (!cloudName || !apiKey || !apiSecret) {
            console.warn('[StorageService] Cloudinary credentials not configured. Image uploads will fail.');
        }
        cloudinary_1.v2.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        });
    }
    /**
     * Upload image to Cloudinary
     * @param base64Image - Base64 encoded image string (with or without data URI prefix)
     * @param folder - Optional folder path in Cloudinary
     * @returns Promise with the uploaded image URL
     */
    async uploadImage(base64Image, folder = 'avatars') {
        try {
            // Remove data URI prefix if present (data:image/jpeg;base64,)
            const base64Data = base64Image.includes(',')
                ? base64Image.split(',')[1]
                : base64Image;
            const result = await cloudinary_1.v2.uploader.upload(`data:image/jpeg;base64,${base64Data}`, {
                folder: `stewiepay/${folder}`,
                resource_type: 'image',
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // Square crop with face detection
                    { quality: 'auto:good' }, // Optimize quality
                    { format: 'auto' }, // Auto format (webp when supported)
                ],
            });
            return result.secure_url;
        }
        catch (error) {
            console.error('[StorageService] Cloudinary upload error:', error);
            throw new Error(`Failed to upload image to Cloudinary: ${error.message || 'Unknown error'}`);
        }
    }
    /**
     * Delete image from Cloudinary
     * @param imageUrl - Full URL of the image to delete
     */
    async deleteImage(imageUrl) {
        try {
            // Extract public_id from URL
            // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
            const urlParts = imageUrl.split('/');
            const uploadIndex = urlParts.findIndex(part => part === 'upload');
            if (uploadIndex === -1) {
                throw new Error('Invalid Cloudinary URL');
            }
            // Get everything after 'upload' (skip version if present)
            const pathParts = urlParts.slice(uploadIndex + 1);
            const versionIndex = pathParts[0]?.startsWith('v') ? 1 : 0;
            const publicIdWithExtension = pathParts.slice(versionIndex).join('/');
            // Remove file extension
            const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
            await cloudinary_1.v2.uploader.destroy(publicId);
        }
        catch (error) {
            // Log error but don't throw - deletion failures shouldn't block operations
            console.error(`Failed to delete image from Cloudinary: ${error.message}`);
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map