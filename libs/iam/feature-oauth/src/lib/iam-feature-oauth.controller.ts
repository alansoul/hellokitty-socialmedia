import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { IamFeatureOauthService } from './iam-feature-oauth.service';
import { JwtAuthGuard } from '@hellokitty/shared-security';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { sub: string };
}

@Controller('oauth')
export class IamFeatureOauthController {
  constructor(private readonly oauthService: IamFeatureOauthService) {}

  // ✨ This is called by YOUR Next.js app to get the code to send to the 3rd-party
  @Post('authorize')
  @UseGuards(JwtAuthGuard) // Must be logged in to HelloKitty!
  async authorize(
    @Body() body: { client_id: string; redirect_uri: string },
    @Req() req: AuthRequest,
  ) {
    const code = await this.oauthService.generateAuthorizationCode(
      req.user.sub,
      body.client_id,
      body.redirect_uri,
    );
    return { code };
  }

  // ✨ This is called by the 3rd-PARTY app's backend to get the real token
  // ✨ This handles BOTH authorization codes AND refresh tokens
  @Post('token')
  async token(
    @Body()
    body: {
      grant_type: string;
      client_id?: string;
      client_secret?: string;
      code?: string;
      refresh_token?: string; // ✨ Added refresh_token
      redirect_uri?: string;
    },
  ) {
    // Flow 1: Exchanging a code for the first time
    if (body.grant_type === 'authorization_code') {
      if (!body.client_id || !body.code || !body.redirect_uri) {
        throw new UnauthorizedException(
          'Missing required parameters for authorization_code',
        );
      }
      return this.oauthService.exchangeToken(
        body.client_id,
        body.client_secret || null,
        body.code,
        body.redirect_uri,
      );
    }

    // ✨ Flow 2: Exchanging a refresh token for a new access token
    if (body.grant_type === 'refresh_token') {
      if (!body.refresh_token) {
        throw new UnauthorizedException('Missing refresh_token');
      }
      return this.oauthService.refreshAccessToken(body.refresh_token);
    }

    // If they ask for a grant_type we don't support yet (like client_credentials)
    throw new UnauthorizedException('Unsupported grant_type');
  }
}
