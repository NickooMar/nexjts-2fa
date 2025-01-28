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

  // return this.client.send<YourType>({ cmd: 'fetchData' }).pipe(
  //   switchMap(response => {
  //     // Perform additional operations with the received data
  //     // For example, make another service call based on the initial response
  //     return this.client.send<YourType>({ cmd: 'processData', data: response });
  //   })
  // );

  signin(input: signinRequestDto) {
    return this.userProxy.findOneByEmail(input.email).pipe(
      map((user) => {
        console.log({ user });

        // if (!user) throw new Error('User not found');

        // const payload = { email: user.email, sub: user.id };
        // const accessToken = this.jwtService.sign(payload);
        return new AccessTokenEntity();
      }),
    );
  }
}
