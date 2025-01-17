import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Controller, Post, Body } from '@nestjs/common';
import { signinRequestDto } from '../../../../libs/shared/dto/signin.dto';
import { AccessTokenEntity } from 'apps/auth/src/domain/entities/access-token.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  singin(@Body() input: signinRequestDto): Observable<AccessTokenEntity> {
    return this.authService.signin(input);
  }
}
