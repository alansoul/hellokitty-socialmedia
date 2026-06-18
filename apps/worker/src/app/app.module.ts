import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PostsWorker } from './posts.worker';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaService } from '@hellokitty/social/data-access';
import { CloudinaryService } from '@hellokitty/shared-storage';

const REDIS_URL_STRING = process.env.REDIS_URL || 'redis://localhost:6379';
const redisUrl = new URL(REDIS_URL_STRING);

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port),
        password: redisUrl.password || undefined,
        tls:
          redisUrl.protocol === 'rediss:'
            ? { rejectUnauthorized: false }
            : undefined,
      },
    }),
  ],
  controllers: [AppController],
  // ✨ Register the worker here!
  providers: [AppService, PostsWorker, PrismaService, CloudinaryService],
})
export class AppModule {}
