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
import * as speakeasy from 'speakeasy';
import { EventEmitter2 } from '@nestjs/event-emitter'; // ✨ Import Event Bus

@Injectable()
export class IamFeatureAuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly prisma: IamPrismaService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Initialize the Google Client with your future Client ID
    this.googleClient = new OAuth2Client(process.env['GOOGLE_CLIENT_ID']);
  }

  // -------------------------------------------------------------
  // SIGNUP METHOD
  // -------------------------------------------------------------

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

    // ✨ EMIT EVENT
    this.eventEmitter.emit('audit.user.signup', {
      tenantId: tenant.id,
      action: 'user.signup',
      actor: email,
      details: 'New user registered via Email/Password',
    });

    return newUser;
  }

  // -------------------------------------------------------------
  // LOGIN METHOD (✨ UPGRADED FOR MFA)
  // -------------------------------------------------------------
  async login(email: string, passwordPlain: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: {
        credentials: true,
        mfaFactors: { where: { verified: true } }, // ✅ Moved INSIDE the include block!
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordCred = user.credentials.find((c) => c.type === 'PASSWORD');
    if (!passwordCred || !passwordCred.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // ✨ FIX: Make sure the user actually sent a password before comparing!
    if (!passwordPlain) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      passwordPlain,
      passwordCred.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // ✨ MFA CHECK: Does the user have a verified TOTP setup?
    if (user.mfaFactors && user.mfaFactors.length > 0) {
      // DO NOT issue an access token. Issue a 5-minute temporary MFA token!
      const mfaPayload = { sub: user.id, mfa_required: true };
      const mfaToken = await this.jwtService.signAsync(mfaPayload, {
        expiresIn: '5m',
      });

      return {
        mfa_required: true,
        mfa_token: mfaToken,
        message: 'Please provide your 6-digit authenticator code.',
      };
    }

    // ✨ EMIT EVENT
    this.eventEmitter.emit('audit.user.login', {
      tenantId: user.tenantId,
      action: 'user.login',
      actor: email,
      details: 'Successful login via Password',
    });

    // No MFA enabled? Log them straight in!
    // ✨ Use the shared helper function
    return this.generateTokens(user.id, user.email, user.tenantId);
  }

  // -------------------------------------------------------------
  // VERIFY MFA LOGIN METHOD (✨ NEW!)
  // -------------------------------------------------------------
  async verifyMfaLogin(mfaToken: string, code: string) {
    let payload;
    try {
      // Verify the temporary 5-minute token
      payload = await this.jwtService.verifyAsync(mfaToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    // Ensure it's actually an MFA token, not a standard access token
    if (!payload.mfa_required) {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { mfaFactors: { where: { verified: true } } },
    });

    if (!user || !user.mfaFactors || user.mfaFactors.length === 0) {
      throw new UnauthorizedException('MFA is not enabled for this user');
    }

    const factor = user.mfaFactors[0];

    // ✨ FIX: Safely check if secret exists to satisfy ESLint
    if (!factor.secret) {
      throw new UnauthorizedException(
        'MFA configuration is broken or missing secret',
      );
    }

    // ✨ Mathematically verify the 6-digit code
    const isValid = speakeasy.totp.verify({
      secret: factor.secret, // No more '!' needed here!
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) throw new UnauthorizedException('Invalid 6-digit code');

    // ✨ EMIT EVENT
    this.eventEmitter.emit('audit.user.login.mfa', {
      tenantId: user.tenantId,
      action: 'user.login.mfa',
      actor: user.email,
      details: 'Successful login via MFA TOTP',
    });

    // Code is perfect! Issue the real JWTs.
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

    if (!payload || !payload.email)
      throw new UnauthorizedException('Google token missing email');

    const googleId = payload.sub;
    const email = payload.email;

    const identity = await this.prisma.identity.findUnique({
      where: {
        provider_providerUserId: {
          provider: 'google',
          providerUserId: googleId,
        },
      },
    });

    let user;

    if (identity) {
      user = await this.prisma.user.findUnique({
        where: { id: identity.userId },
      });
    } else {
      user = await this.prisma.user.findFirst({ where: { email } });

      if (!user) {
        const tenant = await this.prisma.tenant.upsert({
          where: { id: '00000000-0000-0000-0000-000000000001' },
          update: {},
          create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Default Tenant',
            region: 'us-east-1',
          },
        });

        user = await this.prisma.user.create({
          data: {
            email,
            tenantId: tenant.id,
            status: 'ACTIVE',
            emailVerified: true,
          },
        });
      }

      await this.prisma.identity.create({
        data: { provider: 'google', providerUserId: googleId, userId: user.id },
      });
    }

    if (!user)
      throw new UnauthorizedException('Failed to process Google Login');

    // ✨ EMIT EVENT
    this.eventEmitter.emit('audit.user.login.google', {
      tenantId: user.tenantId,
      action: 'user.login.google',
      actor: user.email,
      details: 'Successful login via Google OAuth',
    });

    return this.generateTokens(user.id, user.email, user.tenantId);
  }

  // -------------------------------------------------------------
  // TOKEN GENERATION HELPER
  // -------------------------------------------------------------

  // ✨ HELPER: We extracted token generation so both login methods can use it!
  private async generateTokens(
    userId: string,
    email: string,
    tenantId: string,
  ) {
    // ✨ Fetch all organizations this user belongs to!
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      select: { organizationId: true, role: true },
    });

    // ✨ Format them into a clean dictionary: { "org123": "ADMIN" }
    const orgRoles = memberships.reduce(
      (acc, m) => {
        acc[m.organizationId] = m.role;
        return acc;
      },
      {} as Record<string, string>,
    );

    // ✨ Embed the roles directly into the JWT payload!
    const payload = {
      sub: userId,
      email,
      tenantId,
      org_roles: orgRoles, // <--- The magic happens here!
    };

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
