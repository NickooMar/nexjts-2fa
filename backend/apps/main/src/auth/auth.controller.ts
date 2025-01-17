import { Observable } from 'rxjs';
import { Services } from 'apps/constants';
import { Controller, Post, Body, Inject } from '@nestjs/common';
import { AuthService } from 'apps/auth/src/domain/service/auth.service';
import { signinRequestDto } from '../../../../libs/shared/dto/signin.dto';
import { AccessTokenEntity } from 'apps/auth/src/domain/entities/access-token.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    @Inject(Services.AUTH_SERVICE)
    private readonly authService: AuthService,
  ) {}

  @Post('signin')
  singin(@Body() input: signinRequestDto): Observable<AccessTokenEntity> {
    return this.authService.signin(input);
  }
}
