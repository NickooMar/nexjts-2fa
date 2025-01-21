import { Observable } from 'rxjs';
import { Inject } from '@nestjs/common';
import { User } from '../schemas/user.schema';
import { ClientProxy } from '@nestjs/microservices';
import { Clients, UserPatterns } from 'apps/constants';
import { UserServiceAbstract } from '../../domain/contracts/user.service.abstract';

export class UserProxy implements UserServiceAbstract {
  constructor(
    @Inject(Clients.USER_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  findOneByEmail(email: string): Observable<User> {
    return this.client.send({ cmd: UserPatterns.FIND_ONE_BY_EMAIL }, email);
  }
}
