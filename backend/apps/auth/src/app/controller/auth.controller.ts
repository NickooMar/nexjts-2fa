import { catchError, Observable } from 'rxjs';
import { AuthPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { signinRequestDto } from 'libs/shared/dto/signin.dto';
import { AuthService } from '../../domain/service/auth.service';
import { Controller, HttpException, HttpStatus } from '@nestjs/common';
import { AccessTokenEntity } from '../../domain/entities/access-token.entity';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: AuthPatterns.SIGNIN })
  signin(input: signinRequestDto): Observable<AccessTokenEntity> {
    return this.authService.signin(input).pipe(
      catchError((err) => {
        console.error(err);
        throw new HttpException(
          { message: err.message },
          HttpStatus.UNAUTHORIZED,
        );
      }),
    );
  }
}
