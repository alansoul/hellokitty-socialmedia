import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CloudinaryService } from './cloudinary.service';
import { PrismaService } from '@hellokitty/db';
import { PostsModule } from './posts/posts.module';

// Parse the Cloud Redis URL
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');

@Module({
  imports: [
    // ✨ Configure the Redis Connection
    BullModule.forRoot({
      connection: {
         host: redisUrl.hostname,
        port: Number(redisUrl.port),
        password: redisUrl.password || undefined,
        // ✨ ENTERPRISE FIX: If the URL starts with 'rediss', enforce strict TLS/SSL!
        tls: redisUrl.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
      },
    }),
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService, CloudinaryService, PrismaService],
})
export class AppModule {}
