// apps/core-api/src/app/posts/posts.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import 'multer';

// 1. Get PrismaService from your custom Nx library
import { PrismaService } from '@hellokitty/social/data-access';
// 2. Get the generated types (MediaType) directly from the client
import { MediaType } from '@prisma/client-social';

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

    // ✨ THE BRIDGE: Find or create the MongoDB UserProfile using the Postgres UUID!
    const profile = await this.prisma.userProfile.upsert({
      where: { userId: data.authorId }, // Look up by Postgres UUID from the JWT
      update: {},
      create: {
        userId: data.authorId,
        username: `user_${data.authorId.substring(0, 8)}`,
        displayName: 'New User',
      },
    });

    // 1. Save to DB INSTANTLY (Notice mediaUrl is null for now)
    const post = await this.prisma.post.create({
      data: {
        content: data.content,
        mediaType: file
          ? isVideo
            ? MediaType.VIDEO
            : MediaType.IMAGE
          : MediaType.TEXT,
        authorId: profile.id, // 🔒 FIX: Use the MongoDB ObjectId!
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
