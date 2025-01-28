import { Observable } from 'rxjs';
import { User } from '../schemas/user.schema';
import { Clients, UserPatterns } from 'apps/constants';
import { ClientProxy } from '@nestjs/microservices';
import { UserServiceAbstract } from '../../domain/contracts/user.service.abstract';
import { Inject } from '@nestjs/common';

export class UserProxy implements UserServiceAbstract {
  constructor(
    @Inject(Clients.USER_CLIENT) private readonly client: ClientProxy,
  ) {}

  findOneByEmail(email: string): Observable<User> {
    return this.client.send<User>(
      { cmd: UserPatterns.FIND_ONE_BY_EMAIL },
      email,
    );
  }
}
