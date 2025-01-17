import { Observable } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthPatterns, Clients } from 'apps/constants';
import { signinRequestDto } from '../../../../libs/shared/dto/signin.dto';
import { AccessTokenEntity } from 'apps/auth/src/domain/entities/access-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject(Clients.AUTH_CLIENT) private readonly client: ClientProxy,
  ) {}

  signin(input: signinRequestDto): Observable<AccessTokenEntity> {
    return this.client.send({ cmd: AuthPatterns.SIGNIN }, input);
  }
}
