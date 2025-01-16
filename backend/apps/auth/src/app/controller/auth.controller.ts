import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthPatterns } from 'apps/constants';
import { map, Observable } from 'rxjs';
import { LoginDto } from 'libs/shared/dto/login.dto';
import { AuthService } from '../../domain/service/auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: AuthPatterns.LOGIN })
  login(input: LoginDto): Observable<any> {
    return this.authService
      .login(input)
      .pipe(map((accessToken: string) => accessToken));
  }
}
