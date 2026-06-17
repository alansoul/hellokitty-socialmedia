// apps/social-api/src/app/app.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';

// ✨ Safely parse the Render Internal Redis URL, or fallback to your local computer
const REDIS_URL_STRING = process.env.REDIS_URL || 'redis://localhost:6379';
const redisUrl = new URL(REDIS_URL_STRING);

@Module({
  imports: [
    // 1. Background Jobs Configuration (BullMQ)
    BullModule.forRoot({
      connection: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port),
        password: redisUrl.password || undefined,
        // If the URL starts with rediss://, it enables secure TLS
        tls:
          redisUrl.protocol === 'rediss:'
            ? { rejectUnauthorized: false }
            : undefined,
      },
    }),

    // 2. Caching Configuration (Cache-Manager)
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: REDIS_URL_STRING,
        }),
      }),
    }),

    // 3. Your Feature Modules
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
