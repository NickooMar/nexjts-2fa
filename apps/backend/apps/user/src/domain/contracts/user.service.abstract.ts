import { Observable } from 'rxjs';
import { User } from '../entities/user.entity';

export abstract class UserServiceAbstract {
  abstract findByEmail(email: string): Observable<User>;
}
