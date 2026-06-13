import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { CreatePropertyContactDto } from 'libs/shared/dto/property-contact/property-contact.dto';
import { UpdatePropertyContactDto } from 'libs/shared/dto/property-contact/property-contact.dto';

/** The RPC pattern set a contact roster (tenants or owners) is wired to. */
export interface ContactPatternSet {
  CREATE: string;
  UPDATE: string;
  DELETE: string;
  ATTACH: string;
  DETACH: string;
  FIND_ALL: string;
  FIND_BY_PROPERTY: string;
}

/**
 * Gateway-side proxy to a contact (renter/owner) roster in the user service.
 * Concrete proxies bind it to a {@link ContactPatternSet}. The tenant `dbName`
 * is always supplied by the gateway from the JWT, never the client. Attach /
 * detach use a generic `contactIds` / `contactId` payload internally.
 */
export abstract class PropertyContactProxy {
  protected abstract readonly patterns: ContactPatternSet;

  constructor(protected readonly userClient: ClientProxy) {}

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
    data: CreatePropertyContactDto,
    propertyId?: string,
    createdBy?: string,
  ): Observable<any> {
    return this.userClient
      .send(
        { cmd: this.patterns.CREATE },
        { dbName, data, propertyId, createdBy },
      )
      .pipe(this.forwardRpcError());
  }

  findAll(dbName: string): Observable<any> {
    return this.userClient
      .send({ cmd: this.patterns.FIND_ALL }, { dbName })
      .pipe(this.forwardRpcError());
  }

  findByProperty(dbName: string, propertyId: string): Observable<any> {
    return this.userClient
      .send({ cmd: this.patterns.FIND_BY_PROPERTY }, { dbName, propertyId })
      .pipe(this.forwardRpcError());
  }

  update(
    dbName: string,
    id: string,
    data: UpdatePropertyContactDto,
  ): Observable<any> {
    return this.userClient
      .send({ cmd: this.patterns.UPDATE }, { dbName, id, data })
      .pipe(this.forwardRpcError());
  }

  attach(
    dbName: string,
    propertyId: string,
    contactIds: string[],
  ): Observable<any> {
    return this.userClient
      .send(
        { cmd: this.patterns.ATTACH },
        { dbName, propertyId, contactIds },
      )
      .pipe(this.forwardRpcError());
  }

  detach(
    dbName: string,
    propertyId: string,
    contactId: string,
  ): Observable<any> {
    return this.userClient
      .send(
        { cmd: this.patterns.DETACH },
        { dbName, propertyId, contactId },
      )
      .pipe(this.forwardRpcError());
  }

  delete(dbName: string, id: string): Observable<any> {
    return this.userClient
      .send({ cmd: this.patterns.DELETE }, { dbName, id })
      .pipe(this.forwardRpcError());
  }
}
