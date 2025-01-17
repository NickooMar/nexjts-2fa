import { Module } from '@nestjs/common';
import { Clients, Services } from 'apps/constants';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';

@Module({
  imports: [
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
  providers: [
    {
      provide: Services.AUTH_SERVICE,
      useClass: AuthProxy,
    },
  ],
  exports: [ClientsModule],
})
export class AuthModule {}
