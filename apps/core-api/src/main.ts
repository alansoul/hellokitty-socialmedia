/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { PrismaService } from '@hellokitty/db';
import { GlobalExceptionFilter } from './app/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Strict CORS: In production, this should be restricted to your exact frontend domain.
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  });

  // Global Validation: Automatically strip malicious/unmapped fields from incoming JSON
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ✨ Attach the Global Error Handler!
  app.useGlobalFilters(new GlobalExceptionFilter());

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;

  // SEED A DUMMY USER (For development testing)
  const prisma = app.get(PrismaService);
  const existingUser = await prisma.user.findFirst();
  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: 'test-user-id',
        username: 'kitty_fan_99',
        email: 'test@hellokitty.com',
        passwordHash: 'fake_hash',
        displayName: 'Hello Kitty Fan',
      },
    });
    Logger.log('🌱 Seeded test user into Database!');
  }

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
