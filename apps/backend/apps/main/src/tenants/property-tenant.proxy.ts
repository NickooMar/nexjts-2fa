import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Clients, PropertyTenantPatterns } from 'apps/constants';
import { CreatePropertyTenantDto } from 'libs/shared/dto/property-tenant/create-property-tenant.dto';
import { UpdatePropertyTenantDto } from 'libs/shared/dto/property-tenant/update-property-tenant.dto';

/**
 * Gateway-side proxy to the property-tenant (renter) handlers in the user
 * service. The tenant `dbName` is always supplied by the gateway from the
 * JWT, never the client.
 */
@Injectable()
export class PropertyTenantProxy {
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
    data: CreatePropertyTenantDto,
    propertyId?: string,
    createdBy?: string,
  ): Observable<any> {
    return this.userClient
      .send(
        { cmd: PropertyTenantPatterns.CREATE },
        { dbName, data, propertyId, createdBy },
      )
      .pipe(this.forwardRpcError());
  }

  findAll(dbName: string): Observable<any> {
    return this.userClient
      .send({ cmd: PropertyTenantPatterns.FIND_ALL }, { dbName })
      .pipe(this.forwardRpcError());
  }

  findByProperty(dbName: string, propertyId: string): Observable<any> {
    return this.userClient
      .send(
        { cmd: PropertyTenantPatterns.FIND_BY_PROPERTY },
        { dbName, propertyId },
      )
      .pipe(this.forwardRpcError());
  }

  update(
    dbName: string,
    id: string,
    data: UpdatePropertyTenantDto,
  ): Observable<any> {
    return this.userClient
      .send({ cmd: PropertyTenantPatterns.UPDATE }, { dbName, id, data })
      .pipe(this.forwardRpcError());
  }

  attach(
    dbName: string,
    propertyId: string,
    tenantIds: string[],
  ): Observable<any> {
    return this.userClient
      .send(
        { cmd: PropertyTenantPatterns.ATTACH },
        { dbName, propertyId, tenantIds },
      )
      .pipe(this.forwardRpcError());
  }

  detach(
    dbName: string,
    propertyId: string,
    tenantId: string,
  ): Observable<any> {
    return this.userClient
      .send(
        { cmd: PropertyTenantPatterns.DETACH },
        { dbName, propertyId, tenantId },
      )
      .pipe(this.forwardRpcError());
  }

  delete(dbName: string, id: string): Observable<any> {
    return this.userClient
      .send({ cmd: PropertyTenantPatterns.DELETE }, { dbName, id })
      .pipe(this.forwardRpcError());
  }
}
