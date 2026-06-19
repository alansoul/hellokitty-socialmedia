import { Module } from '@nestjs/common';
import { IamFeatureUsersController } from './iam-feature-users.controller';
import { IamFeatureUsersService } from './iam-feature-users.service';
import { IamPrismaService } from '@hellokitty/data-access';

@Module({
  controllers: [IamFeatureUsersController],
  providers: [IamFeatureUsersService, IamPrismaService],
  exports: [IamFeatureUsersService],
})
export class IamFeatureUsersModule {}
