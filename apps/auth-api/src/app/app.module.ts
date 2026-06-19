import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IamFeatureAuthModule } from '@hellokitty/feature-auth';
import { IamFeatureApplicationsModule } from '@hellokitty/iam-feature-applications';
import { IamFeatureUsersModule } from '@hellokitty/iam-feature-users';
import { IamFeatureOrganizationsModule } from '@hellokitty/iam-feature-organizations';

@Module({
  imports: [
    IamFeatureAuthModule,
    IamFeatureApplicationsModule,
    IamFeatureUsersModule,
    IamFeatureOrganizationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
