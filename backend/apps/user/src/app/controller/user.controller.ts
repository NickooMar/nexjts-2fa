import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { UserPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { User } from '../../domain/entities/user.entity';
import { UserService } from '../../domain/services/user.service';
import { CreateUserDto } from 'libs/shared/dto/user/create-user.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: UserPatterns.FIND_BY_EMAIL })
  findByEmail(email: string): Observable<User | null> {
    return this.userService.findByEmail(email);
  }

  @MessagePattern({ cmd: UserPatterns.CREATE })
  create(user: CreateUserDto): Observable<User> {
    return this.userService.create(user);
  }
}
