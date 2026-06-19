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
      secret: process.env['JWT_SECRET'] || 'super-secret-dev-key-change-in-prod',
    }),
  ],
  controllers: [IamFeatureOauthController],
  providers: [IamFeatureOauthService, IamPrismaService],
  exports: [IamFeatureOauthService],
})
export class IamFeatureOauthModule {}