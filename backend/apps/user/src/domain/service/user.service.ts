import { from, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserDocument } from '../../infrastructure/schemas/user.schema';
import { UserServiceAbstract } from '../contracts/user.service.abstract';
import { UserRepository } from '../../infrastructure/repository/user.repository';

@Injectable()
export class UserService implements UserServiceAbstract {
  constructor(private readonly userRepository: UserRepository<UserDocument>) {}

  findByEmail(email: string): Observable<User> {
    return from(this.userRepository.findByEmail(email));
  }
}
