import { Injectable, BadRequestException } from '@nestjs/common';
import { IamPrismaService } from '@hellokitty/data-access';
import * as qrcode from 'qrcode';
// ✨ Industry standard, flawlessly typed library!
import * as speakeasy from 'speakeasy';

@Injectable()
export class IamFeatureMfaService {
  constructor(private readonly prisma: IamPrismaService) {}

  // ✨ NEW: Check if the user has a verified TOTP MFA Factor
  async getMfaStatus(userId: string) {
    const factor = await this.prisma.mfaFactor.findFirst({
      where: { userId, type: 'TOTP', verified: true },
    });
    return { enabled: !!factor };
  }

  // 1. SETUP: Generate the Secret and QR Code
  async generateSecret(userId: string, email: string) {
    // ✨ FIX: Increased length to 20 bytes (160 bits).
    // This generates exactly 32 Base32 characters with NO '=' padding.
    // Google Authenticator requires >= 128 bits and often fails on padding!
    const secret = speakeasy.generateSecret({
      length: 20,
    });

    // ✨ Production Polish 1: Force Base32 to UPPERCASE (RFC 4648 compliance)
    // This prevents manual-entry failures on strict or older authenticator devices.
    const base32Secret = secret.base32.toUpperCase();

    const issuer = 'HelloKitty';
    const cleanEmail = email.trim();

    // ✨ Production Polish 2: Standard-Compliant OIDC URI Formatting
    // We encode the Issuer and Email individually, leaving the colon separator unencoded.
    const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(cleanEmail)}`;
    const otpauthUrl = `otpauth://totp/${label}?secret=${base32Secret}&issuer=${encodeURIComponent(issuer)}`;

    // Convert the compliant URL into a Base64 QR Code image
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    // Delete any previous UNVERIFIED setup attempts for this user
    await this.prisma.mfaFactor.deleteMany({
      where: { userId, type: 'TOTP', verified: false },
    });

    // Save the new base32 secret to the database (unverified for now)
    await this.prisma.mfaFactor.create({
      data: {
        userId,
        type: 'TOTP',
        secret: base32Secret,
        verified: false,
      },
    });

    // Return the image and the text-based secret
    return { secret: base32Secret, qrCodeDataUrl };
  }

  // 2. VERIFY: Check the 6-digit code and lock it in!
  async verifyAndEnable(userId: string, code: string) {
    // Find the pending setup
    const factor = await this.prisma.mfaFactor.findFirst({
      where: { userId, type: 'TOTP', verified: false },
    });

    if (!factor || !factor.secret) {
      throw new BadRequestException(
        'No MFA enrollment process found. Please start setup first.',
      );
    }

    // ✨ Mathematically verify the 6-digit code! (window: 1 allows 30 seconds of clock drift)
    const isValid = speakeasy.totp.verify({
      secret: factor.secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 6-digit code. Please try again.');
    }

    // Success! Lock it in as VERIFIED in the database.
    await this.prisma.mfaFactor.update({
      where: { id: factor.id },
      data: { verified: true },
    });

    return { success: true, message: 'MFA successfully enabled!' };
  }

  // ✨ NEW: Disable MFA (Delete user's TOTP factor)
  async disableMfa(userId: string) {
    await this.prisma.mfaFactor.deleteMany({
      where: { userId, type: 'TOTP' },
    });
    return { success: true, message: 'MFA successfully disabled!' };
  }
}
