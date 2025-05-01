import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { CreateUserDto } from 'libs/shared/dto/user/create-user.dto';

@Injectable()
export abstract class UserRepositoryAbstract {
  abstract findByEmail(email: string): Promise<User>;
  abstract create(user: CreateUserDto): Promise<User>;
}
