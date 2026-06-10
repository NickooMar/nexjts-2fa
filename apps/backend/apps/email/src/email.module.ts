import {
  I18nModule,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
} from 'nestjs-i18n';

import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from 'apps/env.validation';
import { EmailService } from './domain/services/email.service';
import { EmailController } from './app/controller/email.controller';
import { ResendProvider } from './infrastructure/providers/resend/resend.provider';
import { EmailProviderFactory } from './infrastructure/strategy/email.strategy.factory';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema,
      isGlobal: true,
      envFilePath: '.env',
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '/infrastructure/i18n/'),
        watch: true,
      },
      resolvers: [
        new QueryResolver(['lang', 'l']),
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProviderFactory, ResendProvider],
})
export class EmailModule {}
