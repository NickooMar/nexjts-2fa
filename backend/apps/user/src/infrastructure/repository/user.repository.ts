import { Injectable } from '@nestjs/common';
import { UserRepositoryAbstract } from '../../domain/contracts/user.repository.abstract';
import { User } from '../schemas/user.schema';

@Injectable()
export class UserRepository implements UserRepositoryAbstract {
  async findByEmail(email: string): Promise<User> {
    console.log('EMAILL FROM USER REPO');
    console.log({ email });
    return null;
  }
}
