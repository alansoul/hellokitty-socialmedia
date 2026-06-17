import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';

const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');

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
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
      }),
    }),
    PostsModule, // <-- The Posts module you just moved!
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
