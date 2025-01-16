import { Injectable } from '@nestjs/common';
import { LoginDto } from 'libs/shared/dto/login.dto';
import { Observable, of } from 'rxjs';

@Injectable()
export class AuthService {
  constructor() {}

  login(input: LoginDto): Observable<any> {
    console.log({ input });
    return of('123');
  }
}
