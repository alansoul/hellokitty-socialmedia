import { Injectable } from '@nestjs/common';
import { IamPrismaService } from '@hellokitty/data-access';

@Injectable()
export class IamFeatureUsersService {
  constructor(private readonly prisma: IamPrismaService) {}

  async getUsersByTenant(tenantId: string) {
    // Fetch users, but DO NOT include their password hashes!
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        identities: true, // If they linked Google/GitHub
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
