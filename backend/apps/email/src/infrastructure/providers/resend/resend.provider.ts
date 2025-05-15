import { Resend } from 'resend';
import { render } from '@react-email/render';
import { ConfigService } from '@nestjs/config';
import { Observable, from, switchMap } from 'rxjs';
import { I18nContext, I18nService } from 'nestjs-i18n';
import VerificationEmail from '../../emails/verification-email.template';
import { EmailServiceAbstract } from '../../../domain/contracts/email.service.abstract';
import { Injectable } from '@nestjs/common';

interface SendVerificationEmailInput {
  email: string;
  verificationCode: string;
  verificationLink: string;
}

@Injectable()
export class ResendProvider implements EmailServiceAbstract {
  private resend: Resend;

  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
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
        // TEST: REMOVE THIS
        const sendEmailPromise = new Promise((resolve) => {
          resolve(html);
        });
        // const sendEmailPromise = this.resend.emails.send({
        //   from: fromEmail,
        //   to: input.email,
        //   html: html as string,
        //   subject: translations.subject,
        // });
        return from(sendEmailPromise);
      }),
    );
  }
}
