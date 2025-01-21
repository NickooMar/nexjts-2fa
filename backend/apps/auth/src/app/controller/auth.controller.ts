import { catchError, Observable } from 'rxjs';
import { MessagePattern } from '@nestjs/microservices';
import { AuthPatterns, Services } from 'apps/constants';
import { signinRequestDto } from 'libs/shared/dto/signin.dto';
import { AuthService } from '../../domain/service/auth.service';
import { Controller, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { AccessTokenEntity } from '../../domain/entities/access-token.entity';

@Controller()
export class AuthController {
  constructor(
    @Inject(Services.AUTH_SERVICE)
    private readonly authService: AuthService,
  ) {}

  @MessagePattern({ cmd: AuthPatterns.SIGNIN })
  signin(input: signinRequestDto): Observable<AccessTokenEntity> {
    return this.authService.signin(input).pipe(
      catchError((err) => {
        throw new HttpException(
          { message: err.message },
          HttpStatus.UNAUTHORIZED,
        );
      }),
    );
  }
}
