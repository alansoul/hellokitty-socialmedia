import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { IamFeatureMfaService } from './iam-feature-mfa.service';
import { JwtAuthGuard } from '@hellokitty/shared-security';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string };
}

@Controller('mfa')
@UseGuards(JwtAuthGuard) // 🔒 Must be logged in to set up MFA!
export class IamFeatureMfaController {
  constructor(private readonly mfaService: IamFeatureMfaService) {}

  @Post('setup')
  async setupMfa(@Req() req: AuthenticatedRequest) {
    // We pass the email so it shows up nicely in the Google Authenticator App
    return this.mfaService.generateSecret(req.user.sub, req.user.email);
  }

  @Post('verify')
  async verifyMfa(
    @Req() req: AuthenticatedRequest,
    @Body() body: { code: string },
  ) {
    return this.mfaService.verifyAndEnable(req.user.sub, body.code);
  }
}
