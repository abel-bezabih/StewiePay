import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('[StorageService] Cloudinary credentials not configured. Image uploads will fail.');
    }

    cloudinary.config({
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
  async uploadImage(base64Image: string, folder = 'avatars'): Promise<string> {
    try {
      // Remove data URI prefix if present (data:image/jpeg;base64,)
      const base64Data = base64Image.includes(',') 
        ? base64Image.split(',')[1] 
        : base64Image;

      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${base64Data}`,
        {
          folder: `stewiepay/${folder}`,
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // Square crop with face detection
            { quality: 'auto:good' }, // Optimize quality
            { format: 'auto' }, // Auto format (webp when supported)
          ],
        }
      );

      return result.secure_url;
    } catch (error: any) {
      console.error('[StorageService] Cloudinary upload error:', error);
      throw new Error(`Failed to upload image to Cloudinary: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Delete image from Cloudinary
   * @param imageUrl - Full URL of the image to delete
   */
  async deleteImage(imageUrl: string): Promise<void> {
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

      await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      // Log error but don't throw - deletion failures shouldn't block operations
      console.error(`Failed to delete image from Cloudinary: ${error.message}`);
    }
  }
}

