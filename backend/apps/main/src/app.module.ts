import { Clients } from 'apps/constants';
import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PassportModule } from '@nestjs/passport';
import { validationSchema } from 'apps/env.validation';
import { AuthController } from './auth/auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';
import { JwtStrategy } from 'apps/auth/src/infrastructure/strategies/jwt.strategy';

@Global()
@Module({
  imports: [
    PassportModule,
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
  controllers: [AppController, AuthController],
  providers: [AuthProxy, JwtStrategy, UserProxy],
})
export class AppModule {}
