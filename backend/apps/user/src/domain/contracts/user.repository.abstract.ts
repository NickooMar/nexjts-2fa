import { Injectable } from '@nestjs/common';
import { User } from '../../infrastructure/schemas/user.schema';

@Injectable()
export abstract class UserRepositoryAbstract {
  abstract findByEmail(email: string): Promise<User>;
}
