import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'apps/env.validation';
import { UserService } from './domain/service/user.service';
import { UserController } from './app/controller/user.controller';
import { UserRepository } from './infrastructure/repository/user.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: '.env',
    }),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
