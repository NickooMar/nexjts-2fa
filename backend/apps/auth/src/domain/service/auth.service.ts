import { map } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Services } from 'apps/constants';
import { Inject, Injectable } from '@nestjs/common';
import { signinRequestDto } from 'libs/shared/dto/signin.dto';
import { UserService } from 'apps/user/src/domain/service/user.service';
import { AuthServiceAbstract } from '../contracts/auth.service.abstract';

@Injectable()
export class AuthService implements AuthServiceAbstract {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(Services.USER_SERVICE) private readonly userService: UserService,
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
