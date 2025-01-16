import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from 'apps/env.validation';
import { AuthModule } from './auth/auth.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
