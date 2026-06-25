import { Module } from '@nestjs/common';
import { IamFeatureOrganizationsController } from './iam-feature-organizations.controller';
import { IamFeatureOrganizationsService } from './iam-feature-organizations.service';
import { IamPrismaService } from '@hellokitty/data-access';

@Module({
  imports: [],
  controllers: [IamFeatureOrganizationsController],
  providers: [IamFeatureOrganizationsService, IamPrismaService],
  exports: [IamFeatureOrganizationsService],
})
export class IamFeatureOrganizationsModule {}
