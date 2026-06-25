import 'dotenv/config'; // ✨ Added this: Forces loading of workspace .env variables on boot
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ✨ Activate Cookie Parser Middleware
  app.use(cookieParser());

  // ✨ Allow both localhost and Vercel to access this API
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3004',
    'https://hellokitty-socialmedia-oq5v.vercel.app',
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,  // Required to allow cookies to traverse across ports!
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3001;

  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,);
}

bootstrap();
