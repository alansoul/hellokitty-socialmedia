import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Grab the URL from Render/Vercel securely
    const connectionString = process.env['DATABASE_URL'];

    // Create the fast native Postgres connection pool
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    // Pass it to Prisma
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
