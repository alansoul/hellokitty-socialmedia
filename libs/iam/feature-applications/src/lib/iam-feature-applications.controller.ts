import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { IamFeatureApplicationsService } from './iam-feature-applications.service';
import { JwtAuthGuard, StepUpGuard, RequireMfa } from '@hellokitty/shared-security'; 
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string; tenantId: string };
}

@Controller('applications')
@UseGuards(JwtAuthGuard, StepUpGuard) // 🔒 Protected!
export class IamFeatureApplicationsController {
  constructor(private readonly appsService: IamFeatureApplicationsService) {}

  @Post()
  @RequireMfa() // 🔥 This specific endpoint now requires Step-Up MFA!
  async createApplication(
    @Body() body: { name: string; type: 'SPA' | 'WEB' | 'M2M' },
    @Req() req: AuthenticatedRequest,
  ) {
    // ✨ Extract the tenantId securely from the JWT token!
    const tenantId = req.user.tenantId;
    const email = req.user.email; // ✨ Grab the user's email

    return this.appsService.createApplication(
      tenantId,
      body.name,
      body.type,
      email,
    );
  }

  @Get()
  // ✨ Notice: GET /applications is NOT decorated, meaning it only requires standard login (low friction)
  async getApplications(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    return this.appsService.getApplicationsByTenant(tenantId);
  }
}
