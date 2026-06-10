import { Observable } from 'rxjs';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Clients, EmailPatterns } from 'apps/constants';
import { EmailServiceAbstract } from '../../domain/contracts/email.service.abstract';

export class EmailProxy extends EmailServiceAbstract {
  constructor(
    @Inject(Clients.EMAIL_CLIENT) private readonly client: ClientProxy,
  ) {
    super();
  }

  sendVerificationEmail(input: any): Observable<any> {
    return this.client.send(
      { cmd: EmailPatterns.SEND_VERIFICATION_EMAIL },
      input,
    );
  }
}
