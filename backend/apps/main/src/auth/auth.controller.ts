import { Observable } from 'rxjs';
import { Services } from 'apps/constants';
import { Controller, Post, Body, Inject } from '@nestjs/common';
import { signinRequestDto } from '../../../../libs/shared/dto/signin.dto';
import { AccessTokenEntity } from 'apps/auth/src/domain/entities/access-token.entity';
import { AuthServiceAbstract } from 'apps/auth/src/domain/contracts/auth.service.abstract';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    @Inject(Services.AUTH_SERVICE)
    private readonly authService: AuthServiceAbstract,
  ) {}

  @Post('signin')
  singin(@Body() input: signinRequestDto): Observable<AccessTokenEntity> {
    return this.authService.signin(input);
  }
}
