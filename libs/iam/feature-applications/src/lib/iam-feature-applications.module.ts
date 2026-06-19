import { Module } from '@nestjs/common';
import { IamFeatureApplicationsController } from './iam-feature-applications.controller';
import { IamFeatureApplicationsService } from './iam-feature-applications.service';
import { IamPrismaService } from '@hellokitty/data-access';

@Module({
  controllers: [IamFeatureApplicationsController],
  providers: [IamFeatureApplicationsService, IamPrismaService],
  exports: [IamFeatureApplicationsService],
})
export class IamFeatureApplicationsModule {}
