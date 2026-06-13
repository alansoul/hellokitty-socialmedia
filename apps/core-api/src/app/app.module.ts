import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet'; 
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CloudinaryService } from './cloudinary.service';
import { PrismaService } from '@hellokitty/db';
import { PostsModule } from './posts/posts.module';

// Parse the Cloud Redis URL
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');

@Module({
   imports: [
    // 1. Redis for BullMQ (Background Jobs)
    BullModule.forRoot({
      connection: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port),
        password: redisUrl.password || undefined,
        tls: redisUrl.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
      },
    }),
   // 2. ✨ High-Speed Caching (Fixed!)
    CacheModule.registerAsync({
      isGlobal: true, 
      useFactory: async () => ({
        store: await redisStore({
          // By passing the raw URL, the Redis client automatically detects 
          // the 'rediss://' protocol and configures TLS securely!
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
      }),
    }),
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService, CloudinaryService, PrismaService],
})
export class AppModule {}
