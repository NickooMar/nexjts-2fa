import { Observable } from 'rxjs';
import { User } from '../../infrastructure/schemas/user.schema';

export abstract class UserServiceAbstract {
  abstract findOneByEmail(email: string): Observable<User>;
}
