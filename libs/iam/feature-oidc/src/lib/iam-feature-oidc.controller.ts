import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { IamFeatureOidcService } from './iam-feature-oidc.service';
import { JwtAuthGuard } from '@hellokitty/shared-security';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { sub: string };
}

@Controller()
export class IamFeatureOidcController {
  constructor(private readonly oidcService: IamFeatureOidcService) {}

  // ✨ Public Discovery Endpoint (Standard OIDC Protocol)
  @Get('.well-known/openid-configuration')
  getDiscovery() {
    const baseUrl =
      process.env['NEXT_PUBLIC_AUTH_API_URL'] || 'http://localhost:3001/api';
    return this.oidcService.getDiscoveryConfig(baseUrl);
  }

  // ✨ Public JWKS Endpoint (JSON Web Key Set - Empty for now since we use HS256)
  @Get('.well-known/jwks.json')
  getJwks() {
    return this.oidcService.getJwksKeys();
  }

  // ✨ Protected UserInfo Endpoint
  @Get('oidc/userinfo')
  @UseGuards(JwtAuthGuard) // 🔒 Requires the Access Token!
  async getUserInfo(@Req() req: AuthRequest) {
    return this.oidcService.getUserInfo(req.user.sub);
  }
}
