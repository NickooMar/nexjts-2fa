import { Observable } from 'rxjs';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthPatterns, Clients } from 'apps/constants';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { AccessTokenEntity } from '../../domain/entities/access-token.entity';
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
}
