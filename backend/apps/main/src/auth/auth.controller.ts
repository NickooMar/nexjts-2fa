import {
  Get,
  Post,
  Body,
  Query,
  Controller,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable, catchError, map } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';
import { VerifyEmailRequestDto } from 'libs/shared/dto/auth/verify-email.dto';
import { AccessTokenEntity } from 'apps/auth/src/domain/entities/access-token.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authProxy: AuthProxy) {}

  @Get('check-email')
  checkEmail(@Query('email') email: string) {
    return this.authProxy.findUserByEmail(email).pipe(
      map((user) => ({
        success: true,
        exists: !!user,
      })),
      catchError((error) => {
        const errorMessage = error?.message || 'Something went wrong';
        throw new InternalServerErrorException(errorMessage);
      }),
    );
  }

  @Post('signin')
  singin(@Body() input: SigninRequestDto): Observable<AccessTokenEntity> {
    return this.authProxy.signin(input).pipe(
      catchError((error) => {
        if (error?.error instanceof RpcException || error?.status === 'error') {
          throw new InternalServerErrorException(error.message);
        }
        throw new InternalServerErrorException('Something went wrong');
      }),
    );
  }

  @Post('signup')
  signup(@Body() input: SignupRequestDto): Observable<any> {
    return this.authProxy.signup(input).pipe(
      catchError((error) => {
        if (error?.error instanceof RpcException || error?.status === 'error') {
          const errorMessage =
            error.message || error.error?.message || 'Unknown error';

          if (errorMessage.includes('user_already_exists')) {
            throw new ConflictException('User already exists', {
              description: 'user_already_exists',
            });
          }

          throw new InternalServerErrorException(errorMessage);
        }

        throw new InternalServerErrorException('Something went wrong');
      }),
    );
  }

  @Get('verify-email-verification-token')
  verifyEmailVerificationToken(@Query('token') token: string) {
    return this.authProxy.verifyEmailVerificationToken(token).pipe(
      catchError((error) => {
        if (error?.error instanceof RpcException || error?.status === 'error') {
          throw new InternalServerErrorException(error.message);
        }
        throw new InternalServerErrorException('Something went wrong');
      }),
    );
  }

  @Post('verify-email')
  verifyEmail(@Body() input: VerifyEmailRequestDto) {
    return this.authProxy.verifyEmail(input).pipe(
      catchError((error) => {
        throw new InternalServerErrorException(error.message);
      }),
    );
  }

  // @Get('google/callback')
  // @Get('google/callback')
  // @UseGuards()
  // async googleCallback(
  //   @CurrentUser() user: User,
  //   @Res({ passthrough: true }) response: Response,
  // ) {
  //   await this.authService.login(user, response, true);
  // }
}
