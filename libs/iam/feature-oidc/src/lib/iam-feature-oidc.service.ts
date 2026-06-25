import { Injectable, NotFoundException } from '@nestjs/common';
import { IamPrismaService } from '@hellokitty/data-access';
import * as crypto from 'crypto';

export interface JwksKey {
  kty: string;
  use: string;
  alg: string;
  kid: string;
  n: string;
  e: string;
}

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
      id_token_signing_alg_values_supported: ['RS256'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      scopes_supported: ['openid', 'profile', 'email'],
    };
  }

  // ✨ Native JWKS parsing using crypto
  getJwksKeys(): { keys: JwksKey[] } {
    const publicKeyPem = process.env['JWT_PUBLIC_KEY'];
    if (!publicKeyPem) {
      return { keys: [] }; // Fallback
    }

    try {
      // Create a native public key object
      const keyObject = crypto.createPublicKey(publicKeyPem);
      
      // Export directly to JWK format! 
      const jwk = keyObject.export({ format: 'jwk' });

      // Add standard OIDC parameters with nullish coalescing fallback
      const standardJwk: JwksKey = {
        kty: jwk.kty ?? 'RSA',
        n: jwk.n ?? '',
        e: jwk.e ?? '',
        alg: 'RS256',
        use: 'sig',
        kid: process.env['JWT_KEY_ID'] || 'hellokitty-key-1',
      };

      return { keys: [standardJwk] };
    } catch {
      return { keys: [] };
    }
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