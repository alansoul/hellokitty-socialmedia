import { Injectable, BadRequestException } from '@nestjs/common';
import { IamPrismaService } from '@hellokitty/data-access';
import * as qrcode from 'qrcode';
// ✨ Industry standard, flawlessly typed library!
import * as speakeasy from 'speakeasy';

@Injectable()
export class IamFeatureMfaService {
  constructor(private readonly prisma: IamPrismaService) {}

  // 1. SETUP: Generate the Secret and QR Code
  async generateSecret(userId: string, email: string) {
    // ✨ Speakeasy generates the secret and the URL automatically!
    const secret = speakeasy.generateSecret({
      name: `HelloKitty Auth (${email})`,
      issuer: 'HelloKitty',
    });
    
    // Turn the URI into a Base64 Image string so React can display it instantly!
    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url as string);

    // Delete any previous UNVERIFIED setup attempts for this user
    await this.prisma.mfaFactor.deleteMany({
      where: { userId, type: 'TOTP', verified: false }
    });

    // Save the new base32 secret to the database (unverified for now)
    await this.prisma.mfaFactor.create({
      data: {
        userId,
        type: 'TOTP',
        secret: secret.base32,
        verified: false
      }
    });

    // Return the image and the text-based secret
    return { secret: secret.base32, qrCodeDataUrl };
  }

  // 2. VERIFY: Check the 6-digit code and lock it in!
  async verifyAndEnable(userId: string, code: string) {
    // Find the pending setup
    const factor = await this.prisma.mfaFactor.findFirst({
      where: { userId, type: 'TOTP', verified: false }
    });

    if (!factor || !factor.secret) {
      throw new BadRequestException('No MFA enrollment process found. Please start setup first.');
    }

    // ✨ Mathematically verify the 6-digit code! (window: 1 allows 30 seconds of clock drift)
    const isValid = speakeasy.totp.verify({
      secret: factor.secret,
      encoding: 'base32',
      token: code,
      window: 1 
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 6-digit code. Please try again.');
    }

    // Success! Lock it in as VERIFIED in the database.
    await this.prisma.mfaFactor.update({
      where: { id: factor.id },
      data: { verified: true }
    });

    return { success: true, message: 'MFA successfully enabled!' };
  }
}