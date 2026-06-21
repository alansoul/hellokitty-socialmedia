import { Module } from '@nestjs/common';
import { IamFeatureLogsController } from './iam-feature-logs.controller';
import { IamFeatureLogsService } from './iam-feature-logs.service';
import { IamPrismaService } from '@hellokitty/data-access';

@Module({
  controllers: [IamFeatureLogsController],
  providers: [IamFeatureLogsService, IamPrismaService],
  exports: [IamFeatureLogsService],
})
export class IamFeatureLogsModule {}