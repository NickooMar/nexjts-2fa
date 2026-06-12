import { from, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PropertyTenant } from '../entities/property-tenant.entity';
import { CreatePropertyTenantDto } from 'libs/shared/dto/property-tenant/create-property-tenant.dto';
import { UpdatePropertyTenantDto } from 'libs/shared/dto/property-tenant/update-property-tenant.dto';
import { PropertyTenantRepository } from '../../infrastructure/repository/property-tenant.repository';

@Injectable()
export class PropertyTenantService {
  constructor(
    private readonly propertyTenantRepository: PropertyTenantRepository,
  ) {}

  /** `propertyId` (optional) attaches the new tenant to a property on create. */
  create(
    dbName: string,
    input: CreatePropertyTenantDto,
    propertyId?: string,
    createdBy?: string,
  ): Observable<PropertyTenant> {
    return from(
      this.propertyTenantRepository.create(
        dbName,
        { ...input, propertyIds: propertyId ? [propertyId] : [] },
        createdBy,
      ),
    );
  }

  findAll(dbName: string): Observable<PropertyTenant[]> {
    return from(this.propertyTenantRepository.findAll(dbName));
  }

  findByProperty(
    dbName: string,
    propertyId: string,
  ): Observable<PropertyTenant[]> {
    return from(
      this.propertyTenantRepository.findByProperty(dbName, propertyId),
    );
  }

  update(
    dbName: string,
    id: string,
    changes: UpdatePropertyTenantDto,
  ): Observable<PropertyTenant> {
    return from(
      (async () => {
        const existing = await this.propertyTenantRepository.findByIdOrUuid(
          dbName,
          id,
        );
        if (!existing) throw new RpcException('property_tenant_not_found');

        const updated = await this.propertyTenantRepository.update(
          dbName,
          String(existing._id),
          { ...changes },
        );
        if (!updated) throw new RpcException('property_tenant_not_found');
        return updated;
      })(),
    );
  }

  /** Attach existing tenants to a property; returns the updated roster. */
  attach(
    dbName: string,
    propertyId: string,
    tenantIds: string[],
  ): Observable<PropertyTenant[]> {
    return from(
      (async () => {
        await this.propertyTenantRepository.attachToProperty(
          dbName,
          propertyId,
          tenantIds,
        );
        return this.propertyTenantRepository.findByProperty(
          dbName,
          propertyId,
        );
      })(),
    );
  }

  /** Detach unlinks the tenant from the property; their record survives. */
  detach(
    dbName: string,
    propertyId: string,
    tenantId: string,
  ): Observable<{ detached: boolean }> {
    return from(
      (async () => {
        const detached = await this.propertyTenantRepository.detachFromProperty(
          dbName,
          propertyId,
          tenantId,
        );
        if (!detached) throw new RpcException('property_tenant_not_found');
        return { detached };
      })(),
    );
  }

  delete(dbName: string, id: string): Observable<{ deleted: boolean }> {
    return from(
      (async () => {
        const existing = await this.propertyTenantRepository.findByIdOrUuid(
          dbName,
          id,
        );
        if (!existing) throw new RpcException('property_tenant_not_found');
        const deleted = await this.propertyTenantRepository.delete(
          dbName,
          String(existing._id),
        );
        return { deleted };
      })(),
    );
  }
}
