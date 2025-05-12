import { Resend } from 'resend';
import { render } from '@react-email/render';
import { ConfigService } from '@nestjs/config';
import { Observable, from, switchMap } from 'rxjs';
import VerificationEmail from '../../emails/verification-email.template';
import { EmailServiceAbstract } from '../../../domain/contracts/email.service.abstract';

export class ResendProvider implements EmailServiceAbstract {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
  }

  sendVerificationEmail(input: any): Observable<any> {
    return from(
      render(VerificationEmail({ validationCode: input.verificationLink })),
    ).pipe(
      switchMap((html) => {
        const sendEmailPromise = this.resend.emails.send({
          html,
          to: input.email,
          subject: 'Verify Your Email',
          from: 'Acme <onboarding@resend.dev>',
        });

        return from(sendEmailPromise);
      }),
    );
  }
}
