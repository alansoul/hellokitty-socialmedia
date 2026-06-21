import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { IamFeatureLogsService } from './iam-feature-logs.service';
import { JwtAuthGuard } from '@hellokitty/shared-security';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { sub: string; email: string; tenantId: string };
}

@Controller('logs')
@UseGuards(JwtAuthGuard) // 🔒 Protect the logs!
export class IamFeatureLogsController {
  constructor(private readonly logsService: IamFeatureLogsService) {}

  @Get()
  async getLogs(@Req() req: AuthRequest) {
    return this.logsService.getTenantLogs(req.user.tenantId);
  }

  // ✨ A test endpoint so we can manually trigger logs from the UI
  @Post('test-event')
  async createTestEvent(@Req() req: AuthRequest, @Body() body: { action: string, details: string }) {
    return this.logsService.logEvent(req.user.tenantId, body.action, req.user.email, body.details);
  }
}