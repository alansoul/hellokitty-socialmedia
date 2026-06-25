import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IamFeatureAuthController } from './iam-feature-auth.controller';
import { IamFeatureAuthService } from './iam-feature-auth.service';
import { IamPrismaService } from '@hellokitty/data-access';
 

@Module({
  imports: [
    // ✨ Register the JWT Module with a secret key
    JwtModule.register({
      global: true,
      // ✨ Parse escaped backslash-n into real cryptographic newlines!
      privateKey: process.env['JWT_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
      publicKey: process.env['JWT_PUBLIC_KEY']?.replace(/\\n/g, '\n'),
      signOptions: {
        algorithm: 'RS256', 
         expiresIn: '1d',  // Tokens expire in 1 Day
        keyid: process.env['JWT_KEY_ID'] || 'hellokitty-key-1'
        }, 
    }),
  ],
  controllers: [IamFeatureAuthController],
  providers: [IamFeatureAuthService, IamPrismaService],
  exports: [IamFeatureAuthService],
})
export class IamFeatureAuthModule {}
