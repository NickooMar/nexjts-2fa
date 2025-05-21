import * as bcrypt from 'bcrypt';
import { from, of, throwError } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { TokensEntity } from '../entities/tokens.entity';
import { catchError, map, switchMap } from 'rxjs/operators';
import { User } from 'apps/user/src/domain/entities/user.entity';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { AuthServiceAbstract } from '../contracts/auth.service.abstract';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';
import { VerifyEmailRequestDto } from 'libs/shared/dto/auth/verify-email.dto';
import { EmailProxy } from 'apps/email/src/infrastructure/external/email.proxy';

@Injectable()
export class AuthService implements AuthServiceAbstract {
  constructor(
    private readonly userProxy: UserProxy,
    private readonly emailProxy: EmailProxy,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signin(input: SigninRequestDto) {
    return from(this.userProxy.findByEmail(input.email)).pipe(
      switchMap((user) => {
        if (!user) {
          return throwError(() => new RpcException('user_not_found'));
        }

        return from(bcrypt.compare(input.password, user.password)).pipe(
          switchMap((isMatch) => {
            if (!isMatch) {
              return throwError(() => new RpcException('invalid_credentials'));
            }

            if (!user.emailVerified) {
              return throwError(() => new RpcException('email_not_verified'));
            }

            return from(this.generateTokens(user));
          }),
        );
      }),
    );
  }

  signup(input: SignupRequestDto) {
    return from(this.userProxy.findByEmail(input.email)).pipe(
      switchMap((user) => {
        if (user) {
          return throwError(() => new RpcException('user_already_exists'));
        }

        const verificationCode = this.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        return from(bcrypt.hash(input.password, 15)).pipe(
          switchMap((hash) =>
            // from(
            //   this.userProxy.create({
            //     password: hash,
            //     email: input.email,
            //     emailVerified: false,
            //     lastName: input.lastName,
            //     firstName: input.firstName,
            //     phoneNumber: input.phoneNumber,
            //   }),
            // ),
            of({
              password: hash,
              _id: 'mockedUserId',
              emailVerified: false,
              lastName: input.lastName,
              firstName: input.firstName,
              phoneNumber: input.phoneNumber,
              email: 'nicoo.marsili@gmail.com',
              emailVerification: {
                expiresAt,
                code: verificationCode,
              },
            }),
          ),
          switchMap((newUser: User) => {
            const frontendUrl = this.configService.get<string>('FRONTEND_URL');
            const verificationToken = this.generateVerificationToken(
              newUser._id,
            );

            const verificationLink = new URL(frontendUrl);
            verificationLink.pathname = '/verify-email';
            verificationLink.searchParams.set('token', verificationToken);

            console.log({ verificationCode, verificationToken, newUser });

            return (
              of({})
                // return this.sendVerificationEmail(
                //   newUser.email,
                //   verificationCode,
                //   verificationLink.toString(),
                // )
                .pipe(
                  map(() => ({
                    success: true,
                    verificationToken,
                    userId: newUser._id,
                    message: 'User created and verification email sent',
                  })),
                  catchError(() =>
                    of({
                      success: true,
                      verificationToken,
                      userId: newUser._id,
                      message:
                        'User created but verification email failed to send',
                    }),
                  ),
                )
            );
          }),
        );
      }),
      catchError((err) => throwError(() => new RpcException(err.message))),
    );
  }

  async verifyEmailVerificationToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'email_verification')
        throw new RpcException('invalid_token_type');

      // const user = await this.userProxy.findById(payload.userId).toPromise();

      // if (!user) throw new RpcException('user_not_found');

      return { success: true, message: 'valid_token' };
    } catch (error) {
      if (error.name === 'TokenExpiredError')
        throw new RpcException('verification_code_expired');

      throw new RpcException('invalid_verification_token');
    }
  }

  async verifyEmail(input: VerifyEmailRequestDto) {
    try {
      const payload = await this.jwtService.verifyAsync(input.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'email_verification')
        throw new RpcException('invalid_token_type');

      // const user = await this.userProxy
      //   .findById(payload.userId)
      //   .pipe(
      //     catchError(() =>
      //       throwError(() => new RpcException('user_not_found')),
      //     ),
      //   )
      //   .toPromise();

      // if (!user) throw new RpcException('user_not_found');

      // await this.userProxy
      //   .update(user._id, { emailVerified: true })
      //   .pipe(
      //     catchError((err) => throwError(() => new RpcException(err.message))),
      //   )
      //   .toPromise();

      return { success: true, message: 'email_verified' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new RpcException('verification_code_expired');
      }
      throw new RpcException('invalid_verification_token');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userProxy.findById(payload.sub).toPromise();
      if (!user) {
        throw new RpcException('user_not_found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new RpcException('invalid_refresh_token');
    }
  }

  private async generateTokens(user: User): Promise<TokensEntity> {
    const payload = { email: user.email, sub: user._id };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
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
        expiresIn: '15h',
      },
    );
  }

  private sendVerificationEmail(
    email: string,
    verificationCode: string,
    verificationLink: string,
  ) {
    return this.emailProxy.sendVerificationEmail({
      email,
      verificationCode,
      verificationLink: verificationLink.toString(),
    });
  }
}
