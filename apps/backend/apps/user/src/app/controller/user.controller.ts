import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { UserPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { User } from '../../domain/entities/user.entity';
import { UserService } from '../../domain/services/user.service';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { CreateUserDto } from 'libs/shared/dto/user/create-user.dto';
import { UpdateUserDto } from 'libs/shared/dto/user/update-user.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: UserPatterns.FIND_BY_EMAIL })
  findByEmail(email: string): Observable<User | null> {
    return this.userService.findByEmail(email);
  }

  @MessagePattern({ cmd: UserPatterns.FIND_BY_EMAIL_AND_PASSWORD })
  findByEmailAndPassword(input: SigninRequestDto): Observable<User | null> {
    return this.userService.findByEmailAndPassword(input);
  }

  @MessagePattern({ cmd: UserPatterns.FIND_BY_ID })
  findById(id: string): Observable<User | null> {
    return this.userService.findById(id);
  }

  @MessagePattern({ cmd: UserPatterns.CREATE })
  create(user: CreateUserDto): Observable<User> {
    return this.userService.create(user);
  }

  @MessagePattern({ cmd: UserPatterns.UPDATE })
  update(input: { id: string; updateUserDto: UpdateUserDto }) {
    return this.userService.update(input.id, input.updateUserDto);
  }
}
