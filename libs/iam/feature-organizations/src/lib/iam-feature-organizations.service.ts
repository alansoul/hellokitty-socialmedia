import { Injectable } from '@nestjs/common';
import { IamPrismaService } from '@hellokitty/data-access';

@Injectable()
export class IamFeatureOrganizationsService {
  constructor(private readonly prisma: IamPrismaService) {}

  async createOrganization(tenantId: string, userId: string, name: string) {
    // ✨ Use a Prisma Transaction!
    // This ensures that if the Membership fails, the Organization is rolled back.
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create the Org
      const org = await tx.organization.create({
        data: {
          tenantId,
          name,
          displayName: name,
        },
      });

      // 2. Make the creator the Admin
      await tx.membership.create({
        data: {
          userId,
          organizationId: org.id,
          role: 'ADMIN',
        },
      });

      return org;
    });

    return result;
  }

  async getUserOrganizations(userId: string) {
    // Find all memberships for this user, and include the Org details
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: {
        organization: true,
      },
      orderBy: { organization: { name: 'asc' } },
    });

    // Map it so it returns a clean array of organizations with the user's role attached
    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      displayName: m.organization.displayName,
      myRole: m.role,
    }));
  }
}
