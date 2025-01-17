import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'apps/env.validation';
import { Repositories, Services } from 'apps/constants';
import { UserService } from './domain/service/user.service';
import { UserRepository } from './infrastructure/repository/user.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: '.env',
    }),
  ],
  providers: [
    {
      provide: Services.USER_SERVICE,
      useClass: UserService,
    },
    {
      provide: Repositories.USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [Services.USER_SERVICE, Repositories.USER_REPOSITORY],
})
export class UserModule {}
