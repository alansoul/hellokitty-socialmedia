import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// ✨ Notice it imports from the IAM client!
import { PrismaClient } from '@prisma/client-iam'; 

@Injectable()
export class IamPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // No constructor needed since we downgraded to v6!

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}