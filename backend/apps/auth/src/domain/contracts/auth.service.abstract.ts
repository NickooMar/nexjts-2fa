import { Observable } from 'rxjs';
import { signinRequestDto } from 'libs/shared/dto/signin.dto';
import { AccessTokenEntity } from '../entities/access-token.entity';

export abstract class AuthServiceAbstract {
  abstract signin(input: signinRequestDto): Observable<AccessTokenEntity>;
}
