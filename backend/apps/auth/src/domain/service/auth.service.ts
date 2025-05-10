import * as bcrypt from 'bcrypt';
import { from, throwError } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { catchError, map, switchMap } from 'rxjs/operators';
import { User } from 'apps/user/src/domain/entities/user.entity';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { AccessTokenEntity } from '../entities/access-token.entity';
import { AuthServiceAbstract } from '../contracts/auth.service.abstract';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';
import { EmailProxy } from 'apps/email/src/infrastructure/email.proxy';

@Injectable()
export class AuthService implements AuthServiceAbstract {
  constructor(
    private readonly userProxy: UserProxy,
    private readonly emailProxy: EmailProxy,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signin(input: SigninRequestDto) {
    return this.userProxy.findByEmail(input.email).pipe(
      map((user) => {
        if (!user) throw new Error('User not found');

        // const payload = { email: user.email, sub: user.id };
        // const accessToken = this.jwtService.sign(payload);
        return new AccessTokenEntity();
      }),
    );
  }

  signup(input: SignupRequestDto) {
    return from(this.userProxy.findByEmail(input.email)).pipe(
      switchMap((user) => {
        // if (user)
        //   return throwError(() => new RpcException('user_already_exists'));

        return from(bcrypt.hash(input.password, 15)).pipe(
          // switchMap((hash) =>
          //   from(
          //     this.userProxy.create({
          //       password: hash,
          //       email: input.email,
          //       emailVerified: false,
          //       lastName: input.lastName,
          //       firstName: input.firstName,
          //       phoneNumber: input.phoneNumber,
          //     }),
          //   ),
          // ),
          // switchMap((newUser: User) =>
          //   this.sendVerificationEmail(newUser.email, newUser._id).pipe(
          //     map(() => ({
          //       message: 'User created and verification email sent',
          //       userId: newUser._id,
          //     })),
          //   ),
          // ),

          switchMap((hash) => {
            // Mock the newUser object instead of creating it in the database
            const newUser = {
              _id: 'mockedUserId', // Replace with a mock ID
              email: input.email,
              emailVerified: false,
              lastName: input.lastName,
              firstName: input.firstName,
              phoneNumber: input.phoneNumber,
              password: hash,
            };

            // Trigger the sendVerificationEmail method
            return this.sendVerificationEmail(newUser.email, newUser._id).pipe(
              map(() => ({
                message: 'User creation skipped, verification email sent',
                userId: newUser._id,
              })),
            );
          }),
        );
      }),
      catchError((err) => throwError(() => new RpcException(err.message))),
    );
  }

  private sendVerificationEmail(email: string, userId: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationToken = this.generateVerificationToken(userId);

    const verificationLink = new URL(frontendUrl);
    verificationLink.pathname = '/verify-email';
    verificationLink.searchParams.set('token', verificationToken);

    console.log({ verificationLink: verificationLink.toString() });

    return from(this.emailProxy.sendVerificationEmail({ email }));
  }

  private generateVerificationToken(userId: string): string {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    return this.jwtService.sign({ userId }, { secret: jwtSecret });
  }
}
