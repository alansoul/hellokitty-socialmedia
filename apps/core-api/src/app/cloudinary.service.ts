// apps/core-api/src/app/cloudinary.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    // This connects to Cloudinary using your .env variables!
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    this.logger.log('Cloudinary successfully initialized ☁️');
  }

  // A reusable function to upload any image or video!
  async uploadFile(filePath: string, folder = 'hellokitty_posts'): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'auto', // Automatically detects if it's an image or video
      });
      return result.secure_url;
    } catch (error) {
      this.logger.error('Failed to upload file to Cloudinary', error);
      throw new Error('Media upload failed');
    }
  }
}