import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { IamFeatureOrganizationsService } from './iam-feature-organizations.service';
import { JwtAuthGuard } from '@hellokitty/shared-security';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string; tenantId: string };
}

@Controller('organizations')
@UseGuards(JwtAuthGuard) // 🔒 Protect this!
export class IamFeatureOrganizationsController {
  constructor(private readonly orgsService: IamFeatureOrganizationsService) {}

  @Post()
  async createOrg(
    @Body() body: { name: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.sub; // The user creating it
    return this.orgsService.createOrganization(tenantId, userId, body.name);
  }

  @Get()
  async getMyOrgs(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.orgsService.getUserOrganizations(userId);
  }
  // ✨ NEW: Invite User to Organization
  @Post(':orgId/invitations')
  async inviteUser(
    @Param('orgId') orgId: string,
    @Body() body: { email: string; role: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    const requesterId = req.user.sub;
    return this.orgsService.inviteUser(
      tenantId,
      orgId,
      body.email,
      body.role,
      requesterId,
    );
  }

  // ✨ NEW: Accept Invitation
  @Post('invitations/accept')
  async acceptInvitation(
    @Body() body: { token: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const userEmail = req.user.email;
    return this.orgsService.acceptInvitation(body.token, userId, userEmail);
  }
}
