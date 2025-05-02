import { Observable, throwError } from 'rxjs';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Clients, UserPatterns } from 'apps/constants';
import { User } from '../../domain/entities/user.entity';
import { UserServiceAbstract } from '../../domain/contracts/user.service.abstract';
import { CreateUserDto } from 'libs/shared/dto/user/create-user.dto';
import { catchError } from 'rxjs/operators';
import { RpcException } from '@nestjs/microservices';

export class UserProxy implements UserServiceAbstract {
  constructor(
    @Inject(Clients.USER_CLIENT) private readonly client: ClientProxy,
  ) {}

  findByEmail(email: string): Observable<User> {
    return this.client
      .send<User>({ cmd: UserPatterns.FIND_BY_EMAIL }, email)
      .pipe(
        catchError((error) => {
          if (error instanceof RpcException) {
            return throwError(() => error);
          }
          return throwError(() => new RpcException(error.message));
        }),
      );
  }

  create(user: CreateUserDto): Observable<User> {
    return this.client.send<User>({ cmd: UserPatterns.CREATE }, user).pipe(
      catchError((error) => {
        if (error instanceof RpcException) {
          return throwError(() => error);
        }
        return throwError(() => new RpcException(error.message));
      }),
    );
  }
}
