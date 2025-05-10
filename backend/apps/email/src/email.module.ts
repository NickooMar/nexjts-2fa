import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'apps/env.validation';
import { EmailService } from './domain/service/email.service';
import { EmailController } from './app/controller/email.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema,
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
