import {
  Req,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Controller,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, catchError, from, map, switchMap, tap } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { TokensEntity } from 'apps/auth/src/domain/entities/tokens.entity';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';
import { VerifyEmailRequestDto } from 'libs/shared/dto/auth/verify-email.dto';
import { RefreshTokenRequestDto } from 'libs/shared/dto/auth/refresh-token.dto';
import { CaptchaGuard } from '../security/captcha.guard';
import { getClientIp } from '../security/client-ip.util';
import { LoginProtectionGuard } from '../security/login-protection.guard';
import { LoginProtectionService } from '../security/login-protection.service';
import {
  SigninThrottle,
  SignupThrottle,
  RefreshThrottle,
  CheckEmailThrottle,
  VerifyEmailThrottle,
} from '../security/throttle-policies';

/** Signin errors that count as a brute-force attempt (wrong email/password). */
const CREDENTIAL_FAILURES = ['user_not_found', 'invalid_credentials'];

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authProxy: AuthProxy,
    private readonly loginProtection: LoginProtectionService,
  ) {}

  @Get('check-email')
  @CheckEmailThrottle()
  checkEmail(
    @Query('email') email: string,
  ): Observable<{ success: boolean; exists: boolean }> {
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
  @SigninThrottle()
  @UseGuards(LoginProtectionGuard, CaptchaGuard)
  singin(
    @Req() req: Request,
    @Body() input: SigninRequestDto,
  ): Observable<{ success: boolean; tokens: TokensEntity }> {
    const ip = getClientIp(req);
    return this.authProxy.signin(input).pipe(
      tap(() => {
        void this.loginProtection.recordSuccess('login-account', input.email);
        void this.loginProtection.recordSuccess('login-ip', ip);
      }),
      map((tokens) => ({
        success: true,
        tokens: new TokensEntity(tokens),
      })),
      catchError((error) => {
        const message = error?.message || '';
        if (CREDENTIAL_FAILURES.some((code) => message.includes(code))) {
          void this.loginProtection.recordFailure('login-account', input.email);
          void this.loginProtection.recordFailure('login-ip', ip);
        }
        if (error?.error instanceof RpcException || error?.status === 'error') {
          throw new InternalServerErrorException(error.message);
        }
        throw new InternalServerErrorException('Something went wrong');
      }),
    );
  }

  @Post('signup')
  @SignupThrottle()
  @UseGuards(CaptchaGuard)
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

  @Post('refresh')
  @RefreshThrottle()
  refreshToken(@Body() input: RefreshTokenRequestDto) {
    return this.authProxy.refreshToken(input.refreshToken).pipe(
      catchError((error) => {
        throw new InternalServerErrorException(error.message);
      }),
    );
  }

  @Get('verify-email-verification-token')
  @VerifyEmailThrottle()
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
  @VerifyEmailThrottle()
  verifyEmail(@Body() input: VerifyEmailRequestDto) {
    // The 6-digit code is guessable: lock the token after repeated bad codes.
    return from(
      this.loginProtection.assertNotLocked('verify-email', input.token),
    ).pipe(
      switchMap(() =>
        this.authProxy.verifyEmail(input).pipe(
          tap(() => {
            void this.loginProtection.recordSuccess(
              'verify-email',
              input.token,
            );
          }),
          catchError((error) => {
            const message = error?.message || '';
            if (message.includes('invalid_verification_code')) {
              void this.loginProtection.recordFailure(
                'verify-email',
                input.token,
              );
            }
            throw new InternalServerErrorException(error.message);
          }),
        ),
      ),
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
