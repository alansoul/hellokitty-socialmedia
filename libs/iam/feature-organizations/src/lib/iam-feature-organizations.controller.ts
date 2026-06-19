import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
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
    @Req() req: AuthenticatedRequest
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
}