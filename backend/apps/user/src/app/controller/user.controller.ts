import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UserPatterns } from 'apps/constants';
import { UserService } from '../../domain/service/user.service';
import { User } from '../../infrastructure/schemas/user.schema';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: UserPatterns.FIND_ONE_BY_EMAIL })
  findOneByEmail(email: string): Observable<User> {
    console.log('ENTRO USER CONTROLLER');
    return this.userService.findOneByEmail(email);
  }
}
