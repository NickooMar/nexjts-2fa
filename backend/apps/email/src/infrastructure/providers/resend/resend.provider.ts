import { Resend } from 'resend';
import { Injectable, Logger } from '@nestjs/common';
import { render } from '@react-email/render';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Observable, from, switchMap, tap } from 'rxjs';
import VerificationEmail from '../../emails/verification-email.template';
import { EmailServiceAbstract } from '../../../domain/contracts/email.service.abstract';

interface SendVerificationEmailInput {
  email: string;
  verificationCode: string;
  verificationLink: string;
}

@Injectable()
export class ResendProvider extends EmailServiceAbstract {
  private resend: Resend;
  private readonly logger = new Logger(ResendProvider.name);

  constructor(
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
  }

  sendVerificationEmail(input: SendVerificationEmailInput): Observable<any> {
    const { lang } = I18nContext.current();
    const { verificationCode, verificationLink } = input;
    const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL');

    const translations = {
      body: this.i18n.t('email.verification.body', { lang }),
      subject: this.i18n.t('email.verification.subject', { lang }),
      warning: this.i18n.t('email.verification.warning', { lang }),
      button: this.i18n.t('email.verification.button', { lang }),
      footer: this.i18n.t('email.verification.footer', { lang }),
    };

    const html = render(
      VerificationEmail({
        translations,
        verificationCode,
        verificationLink,
      }),
    );

    return from(html).pipe(
      switchMap((html) => {
        const sendEmailPromise = this.resend.emails.send({
          from: fromEmail,
          to: input.email,
          html: html as string,
          subject: translations.subject,
        });
        return from(sendEmailPromise);
      }),
      tap(() => {
        this.logger.log(`[RESEND] - Email successfully sent to ${input.email}`);
      }),
    );
  }
}
