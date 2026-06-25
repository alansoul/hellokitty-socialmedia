import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import { IamFeatureOauthController } from './iam-feature-oauth.controller';
import { IamFeatureOauthService } from './iam-feature-oauth.service';
import { IamPrismaService } from '@hellokitty/data-access';

@Module({
  imports: [
    CacheModule.register(), // In-memory cache for the 60-second codes
    JwtModule.register({
       // ✨ Parse escaped backslash-n into real cryptographic newlines!
      privateKey: process.env['JWT_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
      publicKey: process.env['JWT_PUBLIC_KEY']?.replace(/\\n/g, '\n'),
      signOptions: {
        algorithm: 'RS256',
        expiresIn: '1d',
        keyid: process.env['JWT_KEY_ID'] || 'hellokitty-key-1'
      },
    }),
  ],
  controllers: [IamFeatureOauthController],
  providers: [IamFeatureOauthService, IamPrismaService],
  exports: [IamFeatureOauthService],
})
export class IamFeatureOauthModule {}
