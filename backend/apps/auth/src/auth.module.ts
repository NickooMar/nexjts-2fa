import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { Services } from 'apps/constants';
import { validate } from 'apps/env.validation';
import { UserModule } from 'apps/user/src/user.module';
import { AuthService } from './domain/service/auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './app/controller/auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
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
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: Services.AUTH_SERVICE,
      useClass: AuthService,
    },
  ],
})
export class AuthModule {}
