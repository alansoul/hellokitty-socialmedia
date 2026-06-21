import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IamFeatureRbacService } from './iam-feature-rbac.service';
import { JwtAuthGuard } from '@hellokitty/shared-security';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { sub: string };
}

@Controller('rbac')
@UseGuards(JwtAuthGuard) // 🔒 Protect all RBAC routes!
export class IamFeatureRbacController {
  constructor(private readonly rbacService: IamFeatureRbacService) {}

  @Get('organizations/:orgId/members')
  getMembers(@Param('orgId') orgId: string, @Req() req: AuthRequest) {
    return this.rbacService.getOrganizationMembers(req.user.sub, orgId);
  }

  @Patch('organizations/:orgId/members/:userId')
  updateRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body() body: { role: string },
    @Req() req: AuthRequest,
  ) {
    return this.rbacService.updateMemberRole(
      req.user.sub,
      orgId,
      userId,
      body.role,
    );
  }
}
