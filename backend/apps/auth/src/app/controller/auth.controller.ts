import { Controller, HttpException, HttpStatus } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthPatterns } from 'apps/constants';
import { catchError, Observable } from 'rxjs';
import { LoginDto } from 'libs/shared/dto/login.dto';
import { AuthService } from '../../domain/service/auth.service';
import { AccessTokenEntity } from '../../domain/entities/access-token.entity';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: AuthPatterns.LOGIN })
  login(input: LoginDto): Observable<AccessTokenEntity> {
    return this.authService.login(input).pipe(
      catchError((err) => {
        throw new HttpException(
          { message: err.message },
          HttpStatus.UNAUTHORIZED,
        );
      }),
    );
  }
}
