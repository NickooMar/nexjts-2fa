import { map } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Services } from 'apps/constants';
import { Inject, Injectable } from '@nestjs/common';
import { signinRequestDto } from 'libs/shared/dto/signin.dto';
import { AuthServiceAbstract } from '../contracts/auth.service.abstract';
import { UserServiceAbstract } from 'apps/user/src/domain/contracts/user.service.abstract';

@Injectable()
export class AuthService implements AuthServiceAbstract {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(Services.USER_SERVICE)
    private readonly userService: UserServiceAbstract,
  ) {}

  signin(input: signinRequestDto) {
    return this.userService.findOneByEmail(input.email).pipe(
      map((user) => {
        console.log({ user });
        // const accessToken = this.jwtService.sign({ email: user.email });
        const accessToken = '';
        return { accessToken };
      }),
    );
  }
}
