import { ConfigModule } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { validationSchema } from 'apps/env.validation';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: '.env',
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
