import { Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { EmailProviders } from 'apps/constants';
import { EmailServiceAbstract } from '../contracts/email.service.abstract';
import { EmailProviderFactory } from '../../infrastructure/strategy/email.strategy.factory';

@Injectable()
export class EmailService implements EmailServiceAbstract {
  constructor(private readonly emailProviderFactory: EmailProviderFactory) {}

  sendVerificationEmail(input: any): Observable<any> {
    const provider = this.emailProviderFactory.getProvider(
      EmailProviders.RESEND,
    );

    return provider.sendVerificationEmail(input);
  }
}
