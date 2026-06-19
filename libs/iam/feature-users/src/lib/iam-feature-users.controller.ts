import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { IamFeatureUsersService } from './iam-feature-users.service';
import { JwtAuthGuard } from '@hellokitty/shared-security';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string; tenantId: string };
}

@Controller('users')
@UseGuards(JwtAuthGuard) // 🔒 Protect this route!
export class IamFeatureUsersController {
  constructor(private readonly usersService: IamFeatureUsersService) {}

  @Get()
  async getUsers(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    return this.usersService.getUsersByTenant(tenantId);
  }
}
