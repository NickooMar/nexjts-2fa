import { Observable } from 'rxjs';
import { Controller, Inject } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Services, UserPatterns } from 'apps/constants';
import { UserService } from '../../domain/service/user.service';
import { User } from '../../infrastructure/schemas/user.schema';

@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(
    @Inject(Services.USER_SERVICE)
    private readonly userService: UserService,
  ) {}

  @MessagePattern({ cmd: UserPatterns.FIND_ONE_BY_EMAIL })
  findOneByEmail(email: string): Observable<User> {
    return this.userService.findOneByEmail(email);
  }
}
