import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Repositories, Services } from 'apps/constants';
import { validate } from 'apps/env.validation';
import { UserRepository } from './infrastructure/repository/user.repository';
import { UserService } from './domain/service/user.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
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
