import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { UserPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { User } from '../../domain/entities/user.entity';
import { UserService } from '../../domain/service/user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: UserPatterns.FIND_BY_EMAIL })
  findByEmail(email: string): Observable<User> {
    return this.userService.findByEmail(email);
  }
}
