import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { AuthPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { AuthService } from '../../domain/service/auth.service';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { AccessTokenEntity } from '../../domain/entities/access-token.entity';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: AuthPatterns.SIGNIN })
  signin(input: SigninRequestDto): Observable<AccessTokenEntity> {
    return this.authService.signin(input);
  }

  @MessagePattern({ cmd: AuthPatterns.SIGNUP })
  signup(input: SignupRequestDto): Observable<any> {
    return this.authService.signup(input);
  }
}
