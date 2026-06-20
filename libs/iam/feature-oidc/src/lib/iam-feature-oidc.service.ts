import { Injectable, NotFoundException } from '@nestjs/common';
import { IamPrismaService } from '@hellokitty/data-access';

@Injectable()
export class IamFeatureOidcService {
  constructor(private readonly prisma: IamPrismaService) {}

  // 1. OIDC Discovery Document
  getDiscoveryConfig(baseUrl: string) {
    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/oauth/token`,
      userinfo_endpoint: `${baseUrl}/oidc/userinfo`,
      jwks_uri: `${baseUrl}/.well-known/jwks.json`,
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['HS256', 'RS256'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      scopes_supported: ['openid', 'profile', 'email'],
    };
  }

  // 2. Standard OIDC UserInfo Profile
  async getUserInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    // Return standard OpenID Connect claims
    return {
      sub: user.id,
      email: user.email,
      email_verified: user.emailVerified,
      updated_at: Math.floor(new Date(user.updatedAt).getTime() / 1000), // Standard UNIX timestamp
    };
  }
}
