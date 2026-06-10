import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { Clients, TenantPatterns } from 'apps/constants';
import { Tenant } from '../../domain/entities/tenant.entity';
import { CreateTenantDto } from 'libs/shared/dto/tenant/create-tenant.dto';

@Injectable()
export class TenantProxy {
  constructor(
    @Inject(Clients.USER_CLIENT)
    private readonly userClient: ClientProxy,
  ) {}

  create(input: CreateTenantDto): Observable<Tenant> {
    return this.userClient
      .send<Tenant>({ cmd: TenantPatterns.CREATE }, input)
      .pipe(
        catchError((error) => {
          if (error instanceof RpcException) {
            return throwError(() => error);
          }
          return throwError(() => new RpcException(error.message));
        }),
      );
  }

  findById(id: string): Observable<Tenant> {
    return this.userClient.send<Tenant>({ cmd: TenantPatterns.FIND_BY_ID }, id);
  }

  findBySlug(slug: string): Observable<Tenant> {
    return this.userClient.send<Tenant>(
      { cmd: TenantPatterns.FIND_BY_SLUG },
      slug,
    );
  }
}
