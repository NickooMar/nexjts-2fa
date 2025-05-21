import { from, Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { AuthPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { AuthService } from '../../domain/services/auth.service';
import { User } from 'apps/user/src/domain/entities/user.entity';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';
import { AccessTokenEntity } from '../../domain/entities/access-token.entity';
import { VerifyEmailRequestDto } from 'libs/shared/dto/auth/verify-email.dto';

@Controller()
export class AuthController {
  constructor(
    private readonly userProxy: UserProxy,
    private readonly authService: AuthService,
  ) {}

  @MessagePattern({ cmd: AuthPatterns.SIGNIN })
  signin(input: SigninRequestDto): Observable<AccessTokenEntity> {
    return this.authService.signin(input);
  }

  @MessagePattern({ cmd: AuthPatterns.SIGNUP })
  signup(input: SignupRequestDto): Observable<any> {
    return this.authService.signup(input);
  }

  @MessagePattern({ cmd: AuthPatterns.FIND_USER_BY_EMAIL })
  findUserByEmail(email: string): Observable<User> {
    return this.userProxy.findByEmail(email);
  }

  @MessagePattern({ cmd: AuthPatterns.VERIFY_EMAIL_VERIFICATION_TOKEN })
  verifyEmailVerificationToken(token: string): Observable<any> {
    return from(this.authService.verifyEmailVerificationToken(token));
  }

  @MessagePattern({ cmd: AuthPatterns.VERIFY_EMAIL })
  verifyEmail(input: VerifyEmailRequestDto): Observable<any> {
    return from(this.authService.verifyEmail(input));
  }
}
