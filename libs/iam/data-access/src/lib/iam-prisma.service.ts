import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-iam';

@Injectable()
export class IamPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(IamPrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('🔌 PostgreSQL database successfully connected.');
    } catch {
      // ✨ Fixed: Optional catch binding (omitted '(error)') silences the ESLint warning! [7.1]
      this.logger.warn(
        '⚠️ Database connection failed on startup. This is common if your Neon database is sleeping. ' +
        'NestJS will stay online, and Prisma will automatically reconnect on your first API request.'
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}