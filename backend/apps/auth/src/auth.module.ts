import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from 'apps/env.validation';
import { AuthService } from './domain/service/auth.service';
import { AuthController } from './app/controller/auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
