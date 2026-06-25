import 'dotenv/config'; // ✨ Added: Force loads the workspace .env variables on boot
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // 🔍 DIAGNOSTIC: Verify if social-api can see the Public Key
  const publicKey = process.env['JWT_PUBLIC_KEY'];
  if (!publicKey) {
    logger.error(
      '❌ CRITICAL ERROR: JWT_PUBLIC_KEY is undefined in social-api! ' +
        'Please ensure you copied the public key into the ROOT .env file.',
    );
  } else {
    logger.log('🔑 JWT_PUBLIC_KEY successfully loaded into social-api memory.');
  }

  const app = await NestFactory.create(AppModule);

  // ✨ Activate Cookie Parser Middleware
  app.use(cookieParser());

  // ✨ Allow both localhost and Vercel to access this API
  const allowedOrigins = [
    'http://localhost:3000',
    'https://hellokitty-socialmedia-oq5v.vercel.app',
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true, // Required to allow cookies to traverse across ports!
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
