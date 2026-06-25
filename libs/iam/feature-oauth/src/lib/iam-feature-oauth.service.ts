import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { IamPrismaService } from '@hellokitty/data-access';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';

@Injectable()
export class IamFeatureOauthService {
  constructor(
    private prisma: IamPrismaService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // 1. GENERATE THE 60-SECOND CODE
  async generateAuthorizationCode(
    userId: string,
    clientId: string,
    redirectUri: string,
    codeChallenge?: string,
    codeChallengeMethod?: 'plain' | 'S256',
  ) {
    const app = await this.prisma.application.findUnique({
      where: { clientId },
    });
    if (!app) throw new UnauthorizedException('Invalid client_id');

    // Generate a secure, random 32-character code
    const code = crypto.randomBytes(16).toString('hex');

    // Save to Cache (Expires in 60 seconds / 60000ms)
    await this.cacheManager.set(
      `auth_code:${code}`,
      {
        userId,
        clientId,
        redirectUri,
        codeChallenge,
        codeChallengeMethod: codeChallengeMethod || 'S256',
      },
      60000,
    );

    return code;
  }

  private verifyCodeVerifier(
    verifier: string,
    challenge: string,
    method: 'plain' | 'S256',
  ): boolean {
    if (method === 'plain') {
      return verifier === challenge;
    }

    // SHA-256 Hash and Base64URL encode the verifier
    const hash = crypto.createHash('sha256').update(verifier).digest();
    const base64Url = hash
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return base64Url === challenge;
  }

  // 2. EXCHANGE THE CODE FOR A TOKEN
  async exchangeToken(
    clientId: string,
    clientSecret: string | null,
    code: string,
    redirectUri: string,
    codeVerifier?: string, // ✨ Accept code_verifier
  ) {
    const app = await this.prisma.application.findUnique({
      where: { clientId },
    });
    if (!app) throw new UnauthorizedException('Invalid client');

    // If it's a backend server (WEB/M2M), it must provide the exact secret
    if (app.type !== 'SPA' && app.clientSecret !== clientSecret) {
      throw new UnauthorizedException('Invalid client_secret');
    }

    // Grab the code from the cache
    const cachedData = await this.cacheManager.get<{
      userId: string;
      clientId: string;
      redirectUri: string;
      codeChallenge?: string;
      codeChallengeMethod?: 'plain' | 'S256';
    }>(`auth_code:${code}`);
    if (!cachedData)
      throw new UnauthorizedException('Invalid or expired authorization code');

    // SECURITY: Delete the code immediately so it can never be used again!
    await this.cacheManager.del(`auth_code:${code}`);

    // SECURITY: Ensure the app exchanging the code is the same app that requested it
    if (
      cachedData.clientId !== clientId ||
      cachedData.redirectUri !== redirectUri
    ) {
      throw new UnauthorizedException(
        'Code mismatch or hijack attempt detected',
      );
    }
    // ✨ CRYPTOGRAPHIC PKCE CHECK
    if (cachedData.codeChallenge) {
      if (!codeVerifier) {
        throw new UnauthorizedException(
          'Code verifier is required for PKCE-enabled clients',
        );
      }
      const isPkceValid = this.verifyCodeVerifier(
        codeVerifier,
        cachedData.codeChallenge,
        cachedData.codeChallengeMethod || 'S256',
      );
      if (!isPkceValid) {
        throw new UnauthorizedException('Invalid PKCE code_verifier');
      }
    }

    // Issue the standard JWT Token!
    const user = await this.prisma.user.findUnique({
      where: { id: cachedData.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = {
      sub: user?.id,
      email: user?.email,
      tenantId: user?.tenantId,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    // ✨ Generate a fresh Refresh Token for the initial exchange!
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: { userId: user.id, sessionToken: refreshToken, expiresAt },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken, // Send the new refresh token back!
      token_type: 'Bearer',
      expires_in: 86400,
    };
  }
  // ✨ Added the missing Refresh Token Method!
  async refreshAccessToken(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { sessionToken: refreshToken },
      include: { user: true },
    });

    if (!session || session.revoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate the token
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { sessionToken: newRefreshToken, expiresAt: newExpiresAt },
    });

    const payload = {
      sub: session.user.id,
      email: session.user.email,
      tenantId: session.user.tenantId,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: 86400,
    };
  }
}
