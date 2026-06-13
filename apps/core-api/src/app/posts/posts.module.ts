// apps/core-api/src/app/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MulterModule } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { CloudinaryService } from '../cloudinary.service';
import { PrismaService } from '@hellokitty/db';
import { PostsWorker } from './posts.worker';

@Module({
  imports: [
    // 1. Create a Redis Queue named 'media-upload'
    BullModule.registerQueue({
      name: 'media-upload',
    }),
    // 2. Tell Multer to save uploaded files to a temp folder
    MulterModule.register({
      dest: './tmp/uploads',
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService, CloudinaryService, PrismaService, PostsWorker],
})
export class PostsModule {}
