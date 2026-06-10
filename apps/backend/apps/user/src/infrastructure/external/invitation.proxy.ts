import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { Clients, OrganizationRole, InvitationPatterns } from 'apps/constants';
import { Invitation } from '../../domain/entities/invitation.entity';

@Injectable()
export class InvitationProxy {
  constructor(
    @Inject(Clients.USER_CLIENT)
    private readonly userClient: ClientProxy,
  ) {}

  create(payload: {
    tenantId: string;
    role?: OrganizationRole;
    createdBy?: string;
  }): Observable<Invitation> {
    return this.userClient
      .send<Invitation>({ cmd: InvitationPatterns.CREATE }, payload)
      .pipe(
        catchError((error) => {
          if (error instanceof RpcException) {
            return throwError(() => error);
          }
          return throwError(() => new RpcException(error.message));
        }),
      );
  }

  accept(payload: { code: string; userId: string }): Observable<any> {
    return this.userClient
      .send({ cmd: InvitationPatterns.ACCEPT }, payload)
      .pipe(
        catchError((error) => {
          if (error instanceof RpcException) {
            return throwError(() => error);
          }
          return throwError(() => new RpcException(error.message));
        }),
      );
  }
}
