import { Module } from '@nestjs/common';
import { IamFeatureOidcController } from './iam-feature-oidc.controller';
import { IamFeatureOidcService } from './iam-feature-oidc.service';
import { IamPrismaService } from '@hellokitty/data-access';

@Module({
  controllers: [IamFeatureOidcController],
  providers: [IamFeatureOidcService, IamPrismaService],
  exports: [IamFeatureOidcService],
})
export class IamFeatureOidcModule {}
