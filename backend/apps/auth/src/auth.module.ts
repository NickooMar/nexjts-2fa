import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { Clients } from 'apps/constants';
import { validationSchema } from 'apps/env.validation';
import { AuthService } from './domain/service/auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './app/controller/auth.controller';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';
import { EmailProxy } from 'apps/email/src/infrastructure/email.proxy';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema,
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_SECRET_EXPIRES_IN'),
        },
      }),
    }),
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
      {
        imports: [ConfigModule],
        name: Clients.EMAIL_CLIENT,
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('EMAIL_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('EMAIL_SERVICE_PORT', 3003),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserProxy, EmailProxy],
})
export class AuthModule {}
