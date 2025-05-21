import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { Clients, UserPatterns } from 'apps/constants';
import { User } from '../../domain/entities/user.entity';
import { CreateUserDto } from 'libs/shared/dto/user/create-user.dto';
import { UserServiceAbstract } from '../../domain/contracts/user.service.abstract';

@Injectable()
export class UserProxy implements UserServiceAbstract {
  constructor(
    @Inject(Clients.USER_CLIENT)
    private readonly userClient: ClientProxy,
  ) {}

  findByEmail(email: string): Observable<User> {
    return this.userClient
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

  findById(id: string) {
    return this.userClient.send({ cmd: 'user.findById' }, { id });
  }

  create(user: CreateUserDto): Observable<User> {
    return this.userClient.send<User>({ cmd: UserPatterns.CREATE }, user).pipe(
      catchError((error) => {
        if (error instanceof RpcException) {
          return throwError(() => error);
        }
        return throwError(() => new RpcException(error.message));
      }),
    );
  }

  update(id: string, updateUserDto: any) {
    return this.userClient.send(
      { cmd: 'user.update' },
      { id, ...updateUserDto },
    );
  }
}
