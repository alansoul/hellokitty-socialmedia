import { Module } from '@nestjs/common';
import { IamFeatureMfaController } from './iam-feature-mfa.controller';
import { IamFeatureMfaService } from './iam-feature-mfa.service';
import { IamPrismaService } from '@hellokitty/data-access';

@Module({
  controllers: [IamFeatureMfaController],
  providers: [IamFeatureMfaService, IamPrismaService],
  exports: [IamFeatureMfaService],
})
export class IamFeatureMfaModule {}
