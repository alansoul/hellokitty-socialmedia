// apps/core-api/src/app/posts/posts.worker.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@hellokitty/social/data-access';
import { CloudinaryService } from '../cloudinary.service';
import * as fs from 'fs/promises';

@Processor('media-upload') // Listens to the exact queue we registered
export class PostsWorker extends WorkerHost {
  private readonly logger = new Logger(PostsWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {
    super();
  }

  // This function runs automatically whenever a new job hits Redis
  async process(
    job: Job<{ postId: string; filePath: string; isVideo: boolean }>,
  ) {
    this.logger.log(`👷 Processing media for Post ${job.data.postId}...`);

    try {
      // 1. Upload the temp file to Cloudinary
      const url = await this.cloudinary.uploadFile(job.data.filePath);

      await this.prisma.post.update({
        where: { id: job.data.postId },
        data: { mediaUrl: url },
      });

      // 3. Delete the temporary file from our disk to save space
      await fs.unlink(job.data.filePath);

      this.logger.log(
        `✅ Successfully processed media for Post ${job.data.postId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to process media for Post ${job.data.postId}`,
        error,
      );
      throw error; // BullMQ will automatically retry the job later if it fails!
    }
  }
}
