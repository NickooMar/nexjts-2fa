import { Resend } from 'resend';
import { Observable, from } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { EmailServiceAbstract } from '../../../domain/contracts/email.service.abstract';

export class ResendProvider implements EmailServiceAbstract {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
  }

  sendVerificationEmail(input: any): Observable<any> {
    // const sendEmailPromise = this.resend.emails.send({
    //   from: 'Acme <onboarding@resend.dev>',
    //   to: input.email,
    //   subject: 'Verify Your Email',
    //   html: '<strong>Please verify your email address.</strong>',
    // });
    const sendEmailPromise = Promise.reject(
      new Error('Simulated email sending error'),
    );

    return from(sendEmailPromise);
  }
}
