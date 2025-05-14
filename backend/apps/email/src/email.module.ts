import path from 'path';
import { Module } from '@nestjs/common';
import { I18nModule } from 'nestjs-i18n';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'apps/env.validation';
import { EmailService } from './domain/services/email.service';
import { EmailController } from './app/controller/email.controller';
import { EmailProviderFactory } from './infrastructure/strategy/email.strategy.factory';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema,
      isGlobal: true,
      envFilePath: '.env',
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProviderFactory],
})
export class EmailModule {}
