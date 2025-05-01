import { Observable } from 'rxjs';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Clients, UserPatterns } from 'apps/constants';
import { User } from '../../domain/entities/user.entity';
import { UserServiceAbstract } from '../../domain/contracts/user.service.abstract';
import { CreateUserDto } from 'libs/shared/dto/user/create-user.dto';

export class UserProxy implements UserServiceAbstract {
  constructor(
    @Inject(Clients.USER_CLIENT) private readonly client: ClientProxy,
  ) {}

  findByEmail(email: string): Observable<User> {
    return this.client.send<User>({ cmd: UserPatterns.FIND_BY_EMAIL }, email);
  }

  create(user: CreateUserDto): Observable<User> {
    return this.client.send<User>({ cmd: UserPatterns.CREATE }, user);
  }
}
