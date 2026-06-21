import { Module } from '@nestjs/common';
import { IamFeatureRbacController } from './iam-feature-rbac.controller';
import { IamFeatureRbacService } from './iam-feature-rbac.service';
import { IamPrismaService } from '@hellokitty/data-access';

@Module({
  controllers: [IamFeatureRbacController],
  providers: [IamFeatureRbacService, IamPrismaService],
  exports: [IamFeatureRbacService],
})
export class IamFeatureRbacModule {}