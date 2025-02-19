import { Clients } from 'apps/constants';
import { Global, Module } from '@nestjs/common';
import { validationSchema } from 'apps/env.validation';
import { AuthController } from './auth/auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: '.env',
    }),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: Clients.AUTH_CLIENT,
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('AUTH_SERVICE_PORT', 3001),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthProxy],
})
export class AppModule {}
