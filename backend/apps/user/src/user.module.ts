import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { validationSchema } from 'apps/env.validation';
import { UserService } from './domain/services/user.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserSchema } from './infrastructure/schemas/user.schema';
import { UserController } from './app/controller/user.controller';
import { UserRepository } from './infrastructure/repository/user.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGO_URI',
          'mongodb://localhost:27017/nextjs_nestjs_2fa',
        ),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
