import * as bcrypt from 'bcrypt';
import { from, throwError } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
import { AccessTokenEntity } from '../entities/access-token.entity';
import { AuthServiceAbstract } from '../contracts/auth.service.abstract';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';

@Injectable()
export class AuthService implements AuthServiceAbstract {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userProxy: UserProxy,
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
        if (user) return throwError(() => new Error('Email already exists'));

        return from(bcrypt.hash(input.password, 15)).pipe(
          switchMap((hash) =>
            from(
              this.userProxy.create({
                password: hash,
                email: input.email,
                lastName: input.lastName,
                firstName: input.firstName,
                phoneNumber: input.phoneNumber,
              }),
            ),
          ),
          map((newUser) => ({ message: 'User created', userId: newUser._id })),
        );
      }),
      catchError((err) => throwError(() => new Error(err.message))),
    );
  }
}
