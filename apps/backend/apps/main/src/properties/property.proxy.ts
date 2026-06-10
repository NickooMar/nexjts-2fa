import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { Clients, PropertyPatterns } from 'apps/constants';
import { CreatePropertyDto } from 'libs/shared/dto/property/create-property.dto';
import { UpdatePropertyDto } from 'libs/shared/dto/property/update-property.dto';

/**
 * Gateway-side proxy to the tenant-scoped Property handlers in the user service.
 * The tenant `dbName` is always supplied by the gateway from the JWT, never the
 * client.
 */
@Injectable()
export class PropertyProxy {
  constructor(
    @Inject(Clients.USER_CLIENT)
    private readonly userClient: ClientProxy,
  ) {}

  private forwardRpcError<T>() {
    return catchError<T, Observable<never>>((error) => {
      if (error instanceof RpcException) {
        return throwError(() => error);
      }
      return throwError(() => new RpcException(error.message));
    });
  }

  create(
    dbName: string,
    organizationId: string,
    data: CreatePropertyDto,
    createdBy: string,
  ): Observable<any> {
    return this.userClient
      .send(
        { cmd: PropertyPatterns.CREATE },
        { dbName, organizationId, data, createdBy },
      )
      .pipe(this.forwardRpcError());
  }

  findAll(dbName: string): Observable<any> {
    return this.userClient.send({ cmd: PropertyPatterns.FIND_ALL }, { dbName });
  }

  findById(dbName: string, id: string): Observable<any> {
    return this.userClient.send(
      { cmd: PropertyPatterns.FIND_BY_ID },
      { dbName, id },
    );
  }

  findOne(dbName: string, idOrSlug: string): Observable<any> {
    return this.userClient
      .send({ cmd: PropertyPatterns.FIND_ONE }, { dbName, idOrSlug })
      .pipe(this.forwardRpcError());
  }

  update(
    dbName: string,
    idOrSlug: string,
    data: UpdatePropertyDto,
  ): Observable<any> {
    return this.userClient
      .send({ cmd: PropertyPatterns.UPDATE }, { dbName, idOrSlug, data })
      .pipe(this.forwardRpcError());
  }

  delete(dbName: string, idOrSlug: string): Observable<any> {
    return this.userClient
      .send({ cmd: PropertyPatterns.DELETE }, { dbName, idOrSlug })
      .pipe(this.forwardRpcError());
  }
}
