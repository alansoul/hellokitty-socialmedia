import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { IamPrismaService } from '@hellokitty/data-access';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

@Injectable()
export class IamFeatureOrganizationsService {
  constructor(
    private readonly prisma: IamPrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

    // ✨ EMIT EVENT
    this.eventEmitter.emit('audit.org.created', {
      tenantId,
      action: 'admin.org.created',
      actor: userId,
      details: `Created organization: ${name}`,
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
  // ✨ NEW: Invite a user to an Organization (Admin-Only verification)
  async inviteUser(
    tenantId: string,
    orgId: string,
    invitedEmail: string,
    role: string,
    requesterId: string,
  ) {
    // 1. SECURITY CHECK: Ensure the person inviting is actually an ADMIN of this Organization
    const requesterMembership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId: requesterId, organizationId: orgId },
      },
    });

    if (!requesterMembership || requesterMembership.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only organization ADMINs can invite new members.',
      );
    }

    // 2. Ensure user is not already a member
    const existingMember = await this.prisma.user.findFirst({
      where: {
        email: invitedEmail,
        memberships: { some: { organizationId: orgId } },
      },
    });
    if (existingMember) {
      throw new BadRequestException(
        'User is already a member of this organization.',
      );
    }

    // 3. Generate secure single-use token (expires in 7 days)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId: orgId,
        email: invitedEmail,
        role: role,
        token: token,
        expiresAt: expiresAt,
      },
    });

    // 4. emit audit log event
    this.eventEmitter.emit('audit.org.invite_sent', {
      tenantId,
      action: 'org.invite_sent',
      actor: requesterId,
      details: `Sent invitation to ${invitedEmail} for role ${role}`,
    });

    // ✨ Note: In production, you would drop an email job into BullMQ to send the link!
    return { success: true, invitationId: invitation.id, token };
  }

  // ✨ NEW: Accept an Invitation
  async acceptInvitation(token: string, userId: string, userEmail: string) {
    // 1. Find the invite
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (
      !invitation ||
      invitation.accepted ||
      invitation.expiresAt < new Date()
    ) {
      throw new BadRequestException(
        'The invitation is invalid, expired, or already accepted.',
      );
    }

    // 2. SECURITY CHECK: Ensure the logged-in user's email matches the invited email
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException(
        'This invitation was sent to a different email address.',
      );
    }

    // 3. Execute Membership creation inside a transaction
    await this.prisma.$transaction(async (tx) => {
      // Create membership
      await tx.membership.create({
        data: {
          userId: userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });

      // Mark invite as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { accepted: true },
      });
    });

    this.eventEmitter.emit('audit.org.invite_accepted', {
      tenantId: invitation.organization.tenantId,
      action: 'org.invite_accepted',
      actor: userId,
      details: `Accepted invitation to join ${invitation.organization.name}`,
    });

    return { success: true, organizationId: invitation.organizationId };
  }
}
