import {
  SigninRequestDto,
  // SigninResponseDto,
} from 'libs/shared/dto/auth/signin.dto';

import { Observable } from 'rxjs';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { VerifyEmailRequestDto } from 'libs/shared/dto/auth/verify-email.dto';
import { TokensEntity } from '../entities/tokens.entity';

export abstract class AuthServiceAbstract {
  abstract signin(input: SigninRequestDto): Observable<TokensEntity>;
  abstract signup(input: SignupRequestDto): Observable<any>;
  abstract verifyEmailVerificationToken(token: string): Observable<any>;
  abstract verifyEmail(input: VerifyEmailRequestDto): Observable<any>;
}
