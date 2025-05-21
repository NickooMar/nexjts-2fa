import { User } from '../entities/user.entity';
import { CreateUserDto } from 'libs/shared/dto/user/create-user.dto';

export abstract class UserRepositoryAbstract {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(user: CreateUserDto): Promise<User>;
  abstract update(id: string, updateUserDto: any): Promise<User>;
}
