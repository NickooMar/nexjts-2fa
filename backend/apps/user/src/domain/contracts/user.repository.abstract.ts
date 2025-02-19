import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';

@Injectable()
export abstract class UserRepositoryAbstract {
  abstract findByEmail(email: string): Promise<User>;
}
