import { ConfigModule, ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { validationSchema } from 'apps/env.validation';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Clients } from 'apps/constants';
import { AuthController } from './auth/auth.controller';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';

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
      // {
      //   imports: [ConfigModule],
      //   name: Clients.USER_CLIENT,
      //   useFactory: async (configService: ConfigService) => ({
      //     transport: Transport.TCP,
      //     options: {
      //       host: configService.get<string>('USER_SERVICE_HOST', 'localhost'),
      //       port: configService.get<number>('USER_SERVICE_PORT', 3002),
      //     },
      //   }),
      //   inject: [ConfigService],
      // },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthProxy,
    // , UserProxy
  ],
})
export class AppModule {}
