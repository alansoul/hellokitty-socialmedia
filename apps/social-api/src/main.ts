// apps/social-api/src/main.ts
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✨ Allow both localhost and Vercel to access this API
  const allowedOrigins = [
    'http://localhost:3000',
    'https://hellokitty-socialmedia-oq5v.vercel.app', 
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3002;
  
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();