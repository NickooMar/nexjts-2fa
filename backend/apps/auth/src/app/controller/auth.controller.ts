import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { AuthPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { AuthService } from '../../domain/service/auth.service';
import { signinRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { AccessTokenEntity } from '../../domain/entities/access-token.entity';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: AuthPatterns.SIGNIN })
  signin(input: signinRequestDto): Observable<AccessTokenEntity> {
    return this.authService.signin(input);
  }
}
