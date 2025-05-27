import { from, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { CreateUserDto } from 'libs/shared/dto/user/create-user.dto';
import { UpdateUserDto } from 'libs/shared/dto/user/update-user.dto';
import { UserServiceAbstract } from '../contracts/user.service.abstract';
import { UserRepository } from '../../infrastructure/repository/user.repository';

@Injectable()
export class UserService extends UserServiceAbstract {
  constructor(private readonly userRepository: UserRepository<User>) {
    super();
  }

  findById(id: string): Observable<User> {
    return from(this.userRepository.findById(id));
  }

  findByEmail(email: string): Observable<User> {
    return from(this.userRepository.findByEmail(email));
  }

  findByEmailAndPassword(input: SigninRequestDto): Observable<User> {
    return from(this.userRepository.findByEmailAndPassword(input));
  }

  create(user: CreateUserDto): Observable<User> {
    return from(this.userRepository.create(user));
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return from(this.userRepository.update(id, updateUserDto));
  }
}
