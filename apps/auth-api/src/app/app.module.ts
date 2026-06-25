import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { IamFeatureAuthModule } from '@hellokitty/feature-auth';
import { IamFeatureApplicationsModule } from '@hellokitty/iam-feature-applications';
import { IamFeatureUsersModule } from '@hellokitty/iam-feature-users';
import { IamFeatureOrganizationsModule } from '@hellokitty/iam-feature-organizations';
import { IamFeatureOauthModule } from '@hellokitty/iam-feature-oauth';
import { IamFeatureOidcModule } from '@hellokitty/iam-feature-oidc';
import { IamFeatureMfaModule } from '@hellokitty/iam-feature-mfa';
import { IamFeatureRbacModule } from '@hellokitty/iam-feature-rbac';
import { IamFeatureLogsModule } from '@hellokitty/iam-feature-logs';

@Module({
  imports: [
    EventEmitterModule.forRoot(), // ✨ Activates the global Event Bus
    IamFeatureAuthModule,
    IamFeatureApplicationsModule,
    IamFeatureUsersModule,
    IamFeatureOrganizationsModule,
    IamFeatureOauthModule,
    IamFeatureOidcModule,
    IamFeatureMfaModule,
    IamFeatureRbacModule,
    IamFeatureLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
