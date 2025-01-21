import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Clients, Services } from 'apps/constants';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: Clients.USER_CLIENT,
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('USER_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('USER_SERVICE_PORT', 3002),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [
    {
      provide: Services.USER_SERVICE,
      useClass: UserProxy,
    },
  ],
  exports: [ClientsModule],
})
export class UserModule {}
