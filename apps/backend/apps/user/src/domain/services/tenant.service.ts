import { from, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Tenant } from '../entities/tenant.entity';
import { CreateTenantDto } from 'libs/shared/dto/tenant/create-tenant.dto';
import { TenantRepository } from '../../infrastructure/repository/tenant.repository';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  create(input: CreateTenantDto): Observable<Tenant> {
    return from(this.tenantRepository.create(input));
  }

  findById(id: string): Observable<Tenant | null> {
    return from(this.tenantRepository.findById(id));
  }

  findBySlug(slug: string): Observable<Tenant | null> {
    return from(this.tenantRepository.findBySlug(slug));
  }

  /** Swap logo/banner; `previousKey` lets the gateway purge the old object. */
  updateBranding(
    tenantId: string,
    field: 'logoKey' | 'bannerKey',
    storageKey: string | null,
  ): Observable<{ tenant: Tenant; previousKey?: string }> {
    return from(
      (async () => {
        const result = await this.tenantRepository.updateBranding(
          tenantId,
          field,
          storageKey,
        );
        if (!result) throw new RpcException('tenant_not_found');
        return result;
      })(),
    );
  }
}
