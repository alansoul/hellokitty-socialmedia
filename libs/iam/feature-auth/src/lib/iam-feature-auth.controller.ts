import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { IamFeatureAuthService } from './iam-feature-auth.service';
import { JwtAuthGuard } from '@hellokitty/shared-security';

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

// ✨ Renamed to AuthDto since both signup and login need an email & password
class AuthDto {
  email!: string;
  password!: string;
}

interface AuthenticatedRequest {
  user: { sub: string; email: string; tenantId: string };
}

@Controller('auth')
export class IamFeatureAuthController {
  constructor(private readonly authService: IamFeatureAuthService) {}

  @Post('signup')
  async signup(@Body() body: AuthDto) {
    return this.authService.signup(body.email, body.password);
  }

  @Post('login')
  async login(
    @Body() body: AuthDto,
    @Res({ passthrough: true }) res: CookieResponse, // ✨ Use our decoupled type
  ) {
    const data = await this.authService.login(body.email, body.password);
    // If login was successful (and not redirected for MFA)
    // ✨ TypeScript Type Guard: Safely narrow the union type before reading properties!
    if ('access_token' in data) {
      this.setAuthCookies(res, data.access_token, data.refresh_token);
    }

    return data;
  }

  // ✨ NEW: Google Social Login Endpoint!
  @Post('google')
  async googleLogin(
    @Body() body: { token: string },
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    const data = await this.authService.loginWithGoogle(body.token);
    this.setAuthCookies(res, data.access_token, data.refresh_token);
    return data;
  }
  @Post('login/mfa')
  async loginWithMfa(
    @Body() body: { mfa_token: string; code: string },
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    if (!body.mfa_token || !body.code) {
      throw new UnauthorizedException('mfa_token and code are required');
    }
    const data = await this.authService.verifyMfaLogin(
      body.mfa_token,
      body.code,
    );
    this.setAuthCookies(res, data.access_token, data.refresh_token);
    return data;
  }

  // ✨ NEW: Step-Up MFA Endpoint (Exchanges current active token + code for elevated token)
  @Post('mfa/step-up')
  @UseGuards(JwtAuthGuard) // 🔒 Must be logged in to step up!
  async stepUp(
    @Body() body: { code: string },
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: CookieResponse
  ) {
    if (!body['code']) {
      throw new UnauthorizedException('Verification code is required.');
    }
    const data = await this.authService.stepUpVerification(req.user.sub, body['code']);
    this.setAuthCookies(res, data.access_token, data.refresh_token);
    return data;
  }

  // ✨ NEW: Secure Logout Endpoint (Destroys secure cookies by expiring them) [10]
  @Post('logout')
  async logout(
    @Res({ passthrough: true }) res: CookieResponse
  ) {
    const isProduction = process.env['NODE_ENV'] === 'production';

    // We overwrite both cookies with empty values and set maxAge to 0 (instant expiry) [10]
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0, // Expire instantly! [10]
      path: '/',
    });

    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0, // Expire instantly! [10]
      path: '/',
    });

    return { success: true, message: 'Logged out successfully.' };
  }

  // ✨ Helper to write production-secure HttpOnly cookies
  private setAuthCookies(
    res: CookieResponse,
    accessToken: string,
    refreshToken?: string,
  ) {
    const isProduction = process.env['NODE_ENV'] === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true, // Blocks JavaScript reading (XSS Immune!)
      secure: isProduction, // True in production, false for local development
      sameSite: 'lax', // Needed for cross-origin local port redirections
      maxAge: 24 * 60 * 60 * 1000, // 1 Day
      path: '/',
    });

    if (refreshToken) {
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
        path: '/',
      });
    }
  }
}
