import { Injectable } from '@nestjs/common';
import { EmailProviders } from 'apps/constants';
import { ResendProvider } from '../providers/resend/resend.provider';
import { EmailServiceAbstract } from '../../domain/contracts/email.service.abstract';

@Injectable()
export class EmailProviderFactory {
  constructor(private readonly resendProvider: ResendProvider) {}

  private providers: { [key: string]: EmailServiceAbstract } = {
    [EmailProviders.RESEND]: this.resendProvider,
  };

  getProvider(providerName: string): EmailServiceAbstract {
    const provider = this.providers[providerName];
    if (!provider)
      throw new Error(`Email provider "${providerName}" is not supported.`);
    return provider;
  }
}
