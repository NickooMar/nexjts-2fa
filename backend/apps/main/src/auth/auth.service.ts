import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthPatterns, Clients } from 'apps/constants';
import { LoginDto } from '../../../../libs/shared/dto/login.dto';
import { Observable } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject(Clients.AUTH_CLIENT) private readonly client: ClientProxy,
  ) {}

  login(input: LoginDto): Observable<any> {
    return this.client.send({ cmd: AuthPatterns.LOGIN }, input);
  }
}
