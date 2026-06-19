import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IamFeatureAuthModule } from '@hellokitty/feature-auth';
import { IamFeatureApplicationsModule } from '@hellokitty/iam-feature-applications';

@Module({
  imports: [IamFeatureAuthModule,
    IamFeatureApplicationsModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
