import { from, Observable } from 'rxjs';
import { Repositories } from 'apps/constants';
import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../infrastructure/schemas/user.schema';
import { UserServiceAbstract } from '../contracts/user.service.abstract';
import { UserRepository } from '../../infrastructure/repository/user.repository';

@Injectable()
export class UserService implements UserServiceAbstract {
  constructor(
    @Inject(Repositories.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  findOneByEmail(email: string): Observable<User> {
    return from(this.userRepository.findByEmail(email));
  }
}
