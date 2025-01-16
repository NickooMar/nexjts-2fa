import { Injectable } from '@nestjs/common';
import { LoginDto } from 'libs/shared/dto/login.dto';
import { map, Observable, of } from 'rxjs';
import { AccessTokenEntity } from '../entities/access-token.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  validateUser(email: string, password: string): Observable<boolean> {
    return of(true);
  }

  login(input: LoginDto): Observable<AccessTokenEntity> {
    return this.validateUser(input.email, input.password).pipe(
      map((user) => {
        console.log({ user });
        return new AccessTokenEntity();
      }),
    );
  }
}
