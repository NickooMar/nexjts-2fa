import {
  of,
  map,
  from,
  switchMap,
  catchError,
  throwError,
  Observable,
  firstValueFrom,
} from 'rxjs';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { TokensEntity } from '../entities/tokens.entity';
import { User } from 'apps/user/src/domain/entities/user.entity';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { AuthServiceAbstract } from '../contracts/auth.service.abstract';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';
import { VerifyEmailRequestDto } from 'libs/shared/dto/auth/verify-email.dto';
import { EmailProxy } from 'apps/email/src/infrastructure/external/email.proxy';

@Injectable()
export class AuthService extends AuthServiceAbstract {
  constructor(
    private readonly userProxy: UserProxy,
    private readonly emailProxy: EmailProxy,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  signin(input: SigninRequestDto): Observable<TokensEntity> {
    return from(this.userProxy.findByEmailAndPassword(input)).pipe(
      switchMap((user) =>
        from(this.generateTokens(user)).pipe(
          map((tokens) => new TokensEntity(tokens)),
        ),
      ),
      catchError((err) => throwError(() => new RpcException(err.message))),
    );
  }

  signup(input: SignupRequestDto) {
    return from(this.userProxy.findByEmail(input.email)).pipe(
      switchMap((existingUser) => {
        if (existingUser?.emailVerified) {
          return throwError(() => new RpcException('user_already_exists'));
        }

        const verificationCode = this.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        if (!existingUser) {
          return from(bcrypt.hash(input.password, 15)).pipe(
            switchMap((hash) =>
              from(
                this.userProxy.create({
                  password: hash,
                  email: input.email,
                  emailVerified: false,
                  lastName: input.lastName,
                  firstName: input.firstName,
                  phoneNumber: input.phoneNumber,
                  emailVerification: {
                    expiresAt,
                    code: verificationCode,
                  },
                }),
              ),
            ),
            switchMap((newUser) =>
              this.handleVerificationEmail(newUser, verificationCode),
            ),
          );
        }

        return from(
          this.userProxy.update(existingUser._id, {
            emailVerified: false,
            emailVerification: {
              expiresAt,
              code: verificationCode,
            },
          }),
        ).pipe(
          switchMap((updatedUser) =>
            this.handleVerificationEmail(updatedUser, verificationCode),
          ),
        );
      }),
      catchError((err) => throwError(() => new RpcException(err.message))),
    );
  }

  verifyEmailVerificationToken(token: string): Observable<any> {
    return from(
      this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }),
    ).pipe(
      map(async (payload) => {
        if (payload.type !== 'email_verification')
          throw new RpcException('invalid_token_type');

        const user = await firstValueFrom(
          this.userProxy.findById(payload.userId),
        );

        if (!user) throw new RpcException('user_not_found');

        if (user.emailVerified)
          throw new RpcException('email_already_verified');

        if (user.emailVerification.expiresAt < new Date().toISOString())
          throw new RpcException('verification_code_expired');

        return { success: true, message: 'valid_token' };
      }),
      catchError((error) => throwError(() => new RpcException(error.message))),
    );
  }

  verifyEmail(input: VerifyEmailRequestDto): Observable<any> {
    return from(
      this.jwtService.verifyAsync(input.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }),
    ).pipe(
      switchMap(async (payload) => {
        const { type, userId } = payload;

        if (type !== 'email_verification')
          throw new RpcException('invalid_token_type');

        const user = await firstValueFrom(
          this.userProxy
            .findById(userId)
            .pipe(
              catchError(() =>
                throwError(() => new RpcException('user_not_found')),
              ),
            ),
        );

        if (user.emailVerified)
          throw new RpcException('email_already_verified');

        if (user.emailVerification.expiresAt < new Date().toISOString())
          throw new RpcException('verification_code_expired');

        if (input.code !== user.emailVerification.code)
          throw new RpcException('invalid_verification_code');

        await firstValueFrom(
          this.userProxy
            .update(user._id, { emailVerified: true })
            .pipe(
              catchError((err) =>
                throwError(() => new RpcException(err.message)),
              ),
            ),
        );

        return { success: true, message: 'email_verified' };
      }),
      catchError((error) => throwError(() => new RpcException(error.message))),
    );
  }

  refreshToken(refreshToken: string): Observable<any> {
    return from(
      this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }),
    ).pipe(
      switchMap((payload) =>
        from(this.userProxy.findById(payload.sub)).pipe(
          switchMap((user) => {
            if (!user) {
              throw new RpcException('user_not_found');
            }

            return from(this.generateTokens(user)).pipe(
              map((tokens) => {
                console.log(
                  `Refresh token successfully processed for user: ${user.email}`,
                );

                return {
                  success: true,
                  tokens,
                };
              }),
            );
          }),
        ),
      ),
      catchError((error) => throwError(() => new RpcException(error.message))),
    );
  }

  private async generateTokens(user: User): Promise<TokensEntity> {
    const payload = {
      _id: user._id,
      sub: user._id,
      email: user.email,
      lastName: user?.lastName || '',
      firstName: user?.firstName || '',
      username: `${user?.firstName || ''} ${user?.lastName || ''}`,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15s',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1m',
      }),
    ]);

    return new TokensEntity({ accessToken, refreshToken });
  }

  private generateVerificationCode(): string {
    // Generate a 6-digit verification code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateVerificationToken(userId: string): string {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    return this.jwtService.sign(
      {
        userId,
        type: 'email_verification',
      },
      {
        secret: jwtSecret,
        expiresIn: '15m',
      },
    );
  }

  private handleVerificationEmail(user: User, verificationCode: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationToken = this.generateVerificationToken(user._id);

    const verificationLink = new URL(frontendUrl);
    verificationLink.pathname = '/verify-email';
    verificationLink.searchParams.set('token', verificationToken);

    return this.emailProxy
      .sendVerificationEmail({
        email: user.email,
        verificationCode,
        verificationLink: verificationLink.toString(),
      })
      .pipe(
        map(() => ({
          success: true,
          verificationToken,
          userId: user._id,
          message: 'Verification email sent successfully',
        })),
        catchError(() =>
          of({
            success: true,
            verificationToken,
            userId: user._id,
            message: 'Failed to send verification email',
          }),
        ),
      );
  }
}
