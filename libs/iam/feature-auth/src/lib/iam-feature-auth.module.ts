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
      secret: process.env['JWT_SECRET'] || 'super-secret-dev-key-change-in-prod',
      signOptions: { expiresIn: '1h' }, // Tokens expire in 1 hour
    }),
  ],
  controllers: [IamFeatureAuthController],
  providers: [IamFeatureAuthService, IamPrismaService],
  exports: [IamFeatureAuthService],
})
export class IamFeatureAuthModule {}