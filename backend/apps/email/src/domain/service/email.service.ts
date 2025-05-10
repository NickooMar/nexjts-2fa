import { of } from 'rxjs';
import { Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { EmailServiceAbstract } from '../contracts/email.service.abstract';

@Injectable()
export class EmailService implements EmailServiceAbstract {
  sendVerificationEmail(input: any): Observable<any> {
    console.log({ input });
    return of({ message: 'Email sent' });
  }
}
