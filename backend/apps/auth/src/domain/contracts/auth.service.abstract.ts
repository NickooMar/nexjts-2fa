import { Observable } from 'rxjs';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { AccessTokenEntity } from '../entities/access-token.entity';

export abstract class AuthServiceAbstract {
  abstract signin(input: SigninRequestDto): Observable<AccessTokenEntity>;
  abstract signup(input: SignupRequestDto): Observable<any>;
}
