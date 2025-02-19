import { map } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { signinRequestDto } from 'libs/shared/dto/signin.dto';
import { AccessTokenEntity } from '../entities/access-token.entity';
import { AuthServiceAbstract } from '../contracts/auth.service.abstract';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';

@Injectable()
export class AuthService implements AuthServiceAbstract {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userProxy: UserProxy,
  ) {}

  signin(input: signinRequestDto) {
    return this.userProxy.findByEmail(input.email).pipe(
      map((user) => {
        // if (!user) throw new Error('User not found');

        // const payload = { email: user.email, sub: user.id };
        // const accessToken = this.jwtService.sign(payload);
        return new AccessTokenEntity();
      }),
    );
  }
}
