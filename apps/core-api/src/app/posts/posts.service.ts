// apps/core-api/src/app/posts/posts.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService, MediaType } from '@hellokitty/db';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import 'multer';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    // Notice we removed CloudinaryService here! Only the Worker needs it now.
    @InjectQueue('media-upload') private readonly mediaQueue: Queue,
  ) {}

  async createPost(
    data: { content?: string; authorId: string },
    file?: Express.Multer.File,
  ) {
    const isVideo = file?.mimetype.startsWith('video') || false;

    // 1. Save to DB INSTANTLY (Notice mediaUrl is null for now)
    const post = await this.prisma.post.create({
      data: {
        content: data.content,
        mediaType: file
          ? isVideo
            ? MediaType.VIDEO
            : MediaType.IMAGE
          : MediaType.TEXT,
        authorId: data.authorId,
      },
    });

    // 2. If there is a file, drop it into the Redis Queue!
    if (file) {
      await this.mediaQueue.add('upload-job', {
        postId: post.id,
        filePath: file.path,
        isVideo,
      });
    }

    // 3. Return the post immediately to the user! Lightning fast ⚡
    return post;
  }

  findAll() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    });
  }
}
