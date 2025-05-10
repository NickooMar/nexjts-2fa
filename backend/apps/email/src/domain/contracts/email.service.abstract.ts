import { Observable } from 'rxjs';

export abstract class EmailServiceAbstract {
  abstract sendVerificationEmail(input: any): Observable<any>;
}
