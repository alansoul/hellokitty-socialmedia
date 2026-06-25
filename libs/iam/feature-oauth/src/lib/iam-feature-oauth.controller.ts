import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { IamFeatureOauthService } from './iam-feature-oauth.service';
import { JwtAuthGuard } from '@hellokitty/shared-security';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { sub: string };
}

// ✨ Local Interface: Decouples our library from the Express package
interface CookieResponse {
  cookie(
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'lax' | 'strict' | 'none';
      maxAge?: number;
      path?: string;
    },
  ): this;
}

@Controller('oauth')
export class IamFeatureOauthController {
  constructor(private readonly oauthService: IamFeatureOauthService) {}

  // ✨ This is called by YOUR Next.js app to get the code to send to the 3rd-party
  @Post('authorize')
  @UseGuards(JwtAuthGuard) // Must be logged in to HelloKitty!
  async authorize(
    @Body()
    body: {
      client_id: string;
      redirect_uri: string;
      code_challenge?: string;
      code_challenge_method?: 'plain' | 'S256';
    },
    @Req() req: AuthRequest,
  ) {
    const code = await this.oauthService.generateAuthorizationCode(
      req.user.sub,
      body.client_id,
      body.redirect_uri,
      body.code_challenge,
      body.code_challenge_method,
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
      code_verifier?: string;
    },
    @Res({ passthrough: true }) res: CookieResponse, // ✨ Use our decoupled type
  ) {
    if (body['grant_type'] === 'authorization_code') {
      if (!body['client_id'] || !body['code'] || !body['redirect_uri']) {
        throw new UnauthorizedException(
          'Missing required parameters for authorization_code',
        );
      }
      const data = await this.oauthService.exchangeToken(
        body['client_id'],
        body['client_secret'] || null,
        body['code'],
        body['redirect_uri'],
        body['code_verifier'], // ✨ Fixed: Forwarding the code verifier!
      );
      this.setAuthCookies(res, data.access_token, data.refresh_token);
      return data;
    }

    // ✨ Flow 2: Exchanging a refresh token for a new access token
    if (body['grant_type'] === 'refresh_token') {
      if (!body['refresh_token']) {
        throw new UnauthorizedException('Missing refresh_token');
      }
      const data = await this.oauthService.refreshAccessToken(
        body['refresh_token'],
      );
      this.setAuthCookies(res, data.access_token, data.refresh_token);
      return data;
    }

    // If they ask for a grant_type we don't support yet (like client_credentials)
    throw new UnauthorizedException('Unsupported grant_type');
  }
  private setAuthCookies(
    res: CookieResponse,
    accessToken: string,
    refreshToken?: string,
  ) {
    const isProduction = process.env['NODE_ENV'] === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    if (refreshToken) {
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }
  }
}
