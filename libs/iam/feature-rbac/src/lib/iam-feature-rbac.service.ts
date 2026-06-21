import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { IamPrismaService } from '@hellokitty/data-access';

@Injectable()
export class IamFeatureRbacService {
  constructor(private readonly prisma: IamPrismaService) {}

  // 1. Fetch all members of an Organization
  async getOrganizationMembers(requesterId: string, organizationId: string) {
    // SECURITY: Ensure the person asking is actually in the organization!
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: requesterId, organizationId } },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, email: true } }, // Return email, but hide passwords!
      },
    });
  }

  // 2. Change a user's role (e.g., MEMBER -> ADMIN)
  async updateMemberRole(
    requesterId: string,
    organizationId: string,
    targetUserId: string,
    newRole: string,
  ) {
    // SECURITY: Only Admins can change roles!
    const requester = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: requesterId, organizationId } },
    });

    if (!requester || requester.role !== 'ADMIN') {
      throw new ForbiddenException('Only organization ADMINs can change roles');
    }

    // Ensure the target user is actually in the org
    const target = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId: targetUserId, organizationId },
      },
    });

    if (!target)
      throw new NotFoundException('User is not a member of this organization');

    // Perform the update
    return this.prisma.membership.update({
      where: { id: target.id },
      data: { role: newRole },
    });
  }
}
