import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Controller, Post, Body } from '@nestjs/common';
import { LoginDto } from '../../../../libs/shared/dto/login.dto';
import { AccessTokenEntity } from 'apps/auth/src/domain/entities/access-token.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() input: LoginDto): Observable<AccessTokenEntity> {
    return this.authService.login(input);
  }
}
