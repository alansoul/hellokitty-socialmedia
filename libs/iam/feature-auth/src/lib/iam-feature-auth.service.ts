import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IamPrismaService } from '@hellokitty/data-access';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library'; // ✨ Added Google Library

@Injectable()
export class IamFeatureAuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly prisma: IamPrismaService,
    private readonly jwtService: JwtService,
  ) {
    // Initialize the Google Client with your future Client ID
    this.googleClient = new OAuth2Client(process.env['GOOGLE_CLIENT_ID']);
  }

  async signup(email: string, passwordPlain: string) {
    // 1. Ensure the user doesn't already exist
    const existingUser = await this.prisma.user.findFirst({ where: { email } });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    // 2. Hash the password securely
    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    // 3. True MVP: Auto-create a default Tenant & Application if they don't exist
    const tenant = await this.prisma.tenant.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' }, // Dummy UUID for MVP
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Default Tenant',
        region: 'us-east-1',
      },
    });

    // 4. Create the actual User in the database
    const newUser = await this.prisma.user.create({
      data: {
        email,
        tenantId: tenant.id,
        status: 'ACTIVE',
        credentials: {
          create: {
            type: 'PASSWORD',
            passwordHash: passwordHash,
          },
        },
      },
      // Return the user ID and email, but DO NOT return the password hash
      select: {
        id: true,
        email: true,
        tenantId: true,
        status: true,
        createdAt: true,
      },
    });

    return newUser;
  }

  // -------------------------------------------------------------
  // LOGIN METHOD
  // -------------------------------------------------------------
  async login(email: string, passwordPlain: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { credentials: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordCred = user.credentials.find((c) => c.type === 'PASSWORD');
    if (!passwordCred || !passwordCred.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      passwordPlain,
      passwordCred.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // ✨ Use the shared helper function
    return this.generateTokens(user.id, user.email, user.tenantId);
  }

    // -------------------------------------------------------------
  // GOOGLE LOGIN METHOD
  // -------------------------------------------------------------
  async loginWithGoogle(idToken: string) {
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env['GOOGLE_CLIENT_ID'],
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload || !payload.email) throw new UnauthorizedException('Google token missing email');

    const googleId = payload.sub; 
    const email = payload.email;

    const identity = await this.prisma.identity.findUnique({
      where: { provider_providerUserId: { provider: 'google', providerUserId: googleId } }
    });

    let user;

    if (identity) {
      user = await this.prisma.user.findUnique({ where: { id: identity.userId } });
    } else {
      user = await this.prisma.user.findFirst({ where: { email } });

      if (!user) {
        const tenant = await this.prisma.tenant.upsert({
          where: { id: '00000000-0000-0000-0000-000000000001' },
          update: {},
          create: { id: '00000000-0000-0000-0000-000000000001', name: 'Default Tenant', region: 'us-east-1' },
        });

        user = await this.prisma.user.create({
          data: {
            email,
            tenantId: tenant.id,
            status: 'ACTIVE',
            emailVerified: true, 
          }
        });
      }

      await this.prisma.identity.create({
        data: { provider: 'google', providerUserId: googleId, userId: user.id }
      });
    }

    if (!user) throw new UnauthorizedException('Failed to process Google Login');

    return this.generateTokens(user.id, user.email, user.tenantId);
  }


   // -------------------------------------------------------------
  // TOKEN GENERATION HELPER
  // -------------------------------------------------------------

    // ✨ HELPER: We extracted token generation so both login methods can use it!
  private async generateTokens(userId: string, email: string, tenantId: string) {
    const payload = { sub: userId, email, tenantId };
    const accessToken = await this.jwtService.signAsync(payload);

    // ✨ 1. GENERATE A REFRESH TOKEN (Expires in 7 days)
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // ✨ 2. SAVE THE SESSION TO POSTGRES
    await this.prisma.session.create({
      data: {
        userId: userId,
        sessionToken: refreshToken,
        expiresAt: expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken, // ✨ 3. RETURN IT TO THE USER
      token_type: 'Bearer',
      expires_in: 86400,
    };
  }
}
