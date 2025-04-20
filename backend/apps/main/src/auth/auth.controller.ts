import { Observable } from 'rxjs';
import { Controller, Post, Body } from '@nestjs/common';
import { signinRequestDto } from '../../../../libs/shared/dto/signin.dto';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';
import { AccessTokenEntity } from 'apps/auth/src/domain/entities/access-token.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authProxy: AuthProxy) {}

  @Post('signin')
  singin(@Body() input: signinRequestDto): Observable<AccessTokenEntity> {
    return this.authProxy.signin(input);
  }

  @Post('signup')
  signup(@Body() body: any): any {
    console.log({ body });

    return { message: 'success' };
    // return this.authProxy.signup(input);
  }
}
