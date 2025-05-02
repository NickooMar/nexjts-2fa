import {
  Get,
  Post,
  Body,
  Query,
  Controller,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable, catchError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';
import { AccessTokenEntity } from 'apps/auth/src/domain/entities/access-token.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authProxy: AuthProxy) {}

  @Get('check-email')
  checkEmail(@Query('email') email: string) {
    console.log({ email });
    return { success: true, exists: true };
    // throw new Error('test');
    // return this.authProxy.findUserByProperty('email', 'test@test.com');
  }

  @Post('signin')
  singin(@Body() input: SigninRequestDto): Observable<AccessTokenEntity> {
    return this.authProxy.signin(input);
  }

  @Post('signup')
  signup(@Body() input: SignupRequestDto): Observable<any> {
    return this.authProxy.signup(input).pipe(
      catchError((error) => {
        if (error?.error instanceof RpcException || error?.status === 'error') {
          const errorMessage =
            error.message || error.error?.message || 'Unknown error';

          if (errorMessage.includes('email_already_exists')) {
            throw new ConflictException('Email already exists');
          }

          throw new InternalServerErrorException(errorMessage);
        }

        throw new InternalServerErrorException('Something went wrong');
      }),
    );
  }

  // @Get('google/callback')
  // @UseGuards()
  // async googleCallback(
  //   @CurrentUser() user: User,
  //   @Res({ passthrough: true }) response: Response,
  // ) {
  //   await this.authService.login(user, response, true);
  // }
}
