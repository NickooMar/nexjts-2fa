import { Observable } from 'rxjs';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthPatterns, Clients } from 'apps/constants';
import { User } from 'apps/user/src/domain/entities/user.entity';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { AccessTokenEntity } from '../../domain/entities/access-token.entity';
import { VerifyEmailRequestDto } from 'libs/shared/dto/auth/verify-email.dto';
import { AuthServiceAbstract } from '../../domain/contracts/auth.service.abstract';

export class AuthProxy implements AuthServiceAbstract {
  constructor(
    @Inject(Clients.AUTH_CLIENT) private readonly client: ClientProxy,
  ) {}

  signin(input: SigninRequestDto): Observable<AccessTokenEntity> {
    return this.client.send({ cmd: AuthPatterns.SIGNIN }, input);
  }

  signup(input: SignupRequestDto): Observable<any> {
    return this.client.send({ cmd: AuthPatterns.SIGNUP }, input);
  }

  findUserByEmail(email: string): Observable<User> {
    return this.client.send({ cmd: AuthPatterns.FIND_USER_BY_EMAIL }, email);
  }

  verifyEmailVerificationToken(token: string): Observable<any> {
    return this.client.send(
      { cmd: AuthPatterns.VERIFY_EMAIL_VERIFICATION_TOKEN },
      token,
    );
  }

  verifyEmail(input: VerifyEmailRequestDto): Observable<any> {
    return this.client.send({ cmd: AuthPatterns.VERIFY_EMAIL }, input);
  }
}
