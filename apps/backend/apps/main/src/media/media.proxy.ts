import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Clients, MediaPatterns, TenantPatterns } from 'apps/constants';

export interface MediaFileMetadata {
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
}

/**
 * Gateway-side proxy to the tenant-scoped media metadata handlers in the user
 * service. As with properties, `dbName` always comes from the JWT-resolved
 * tenant context, never from the client.
 */
@Injectable()
export class MediaProxy {
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

  add(params: {
    dbName: string;
    ownerType: string;
    ownerId: string;
    kind: 'image' | 'document';
    uploadedBy?: string;
    files: MediaFileMetadata[];
  }): Observable<any> {
    return this.userClient
      .send({ cmd: MediaPatterns.ADD }, params)
      .pipe(this.forwardRpcError());
  }

  count(params: {
    dbName: string;
    ownerType: string;
    ownerId: string;
    kind: 'image' | 'document';
  }): Observable<number> {
    return this.userClient
      .send({ cmd: MediaPatterns.COUNT }, params)
      .pipe(this.forwardRpcError());
  }

  /** Total stored bytes for the tenant (billing storage usage). */
  totalSize(params: { dbName: string }): Observable<number> {
    return this.userClient
      .send({ cmd: MediaPatterns.TOTAL_SIZE }, params)
      .pipe(this.forwardRpcError());
  }

  remove(params: {
    dbName: string;
    ownerType: string;
    ownerId: string;
    mediaId: string;
  }): Observable<any> {
    return this.userClient
      .send({ cmd: MediaPatterns.REMOVE }, params)
      .pipe(this.forwardRpcError());
  }

  setCover(params: {
    dbName: string;
    ownerType: string;
    ownerId: string;
    mediaId: string;
  }): Observable<any> {
    return this.userClient
      .send({ cmd: MediaPatterns.SET_COVER }, params)
      .pipe(this.forwardRpcError());
  }

  reorder(params: {
    dbName: string;
    ownerType: string;
    ownerId: string;
    orderedIds: string[];
  }): Observable<any> {
    return this.userClient
      .send({ cmd: MediaPatterns.REORDER }, params)
      .pipe(this.forwardRpcError());
  }

  updateTenantBranding(params: {
    tenantId: string;
    field: 'logoKey' | 'bannerKey';
    storageKey: string | null;
  }): Observable<{ tenant: any; previousKey?: string }> {
    return this.userClient
      .send({ cmd: TenantPatterns.UPDATE_BRANDING }, params)
      .pipe(this.forwardRpcError());
  }

  findTenant(tenantId: string): Observable<any> {
    return this.userClient
      .send({ cmd: TenantPatterns.FIND_BY_ID }, tenantId)
      .pipe(this.forwardRpcError());
  }
}
