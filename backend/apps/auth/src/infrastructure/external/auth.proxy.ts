import { Observable } from 'rxjs';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthPatterns, Clients } from 'apps/constants';
import { signinRequestDto } from 'libs/shared/dto/signin.dto';
import { AccessTokenEntity } from '../../domain/entities/access-token.entity';
import { AuthServiceAbstract } from '../../domain/contracts/auth.service.abstract';

export class AuthProxy implements AuthServiceAbstract {
  constructor(
    @Inject(Clients.AUTH_CLIENT) private readonly client: ClientProxy,
  ) {}

  signin(input: signinRequestDto): Observable<AccessTokenEntity> {
    return this.client.send({ cmd: AuthPatterns.SIGNIN }, input);
  }
}
