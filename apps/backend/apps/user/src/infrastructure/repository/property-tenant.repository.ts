import { Schema } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { PropertyTenant } from '../../domain/entities/property-tenant.entity';
import { PropertyTenantSchema } from '../schemas/property-tenant.schema';
import { TenantConnectionService } from '../tenancy/tenant-connection.service';
import {
  PropertyContactRepository,
  CreatePropertyContactRecord,
} from './property-contact.repository';

/** Back-compat alias for the shared create record. */
export type CreatePropertyTenantRecord = CreatePropertyContactRecord;

/**
 * Property-tenant (renter) data lives in the tenant's own database. Behaviour
 * is shared with {@link PropertyContactRepository}; only the collection differs.
 */
@Injectable()
export class PropertyTenantRepository extends PropertyContactRepository<PropertyTenant> {
  protected readonly modelName = 'PropertyTenant';
  protected readonly schema: Schema = PropertyTenantSchema;

  constructor(tenantConnection: TenantConnectionService) {
    super(tenantConnection);
  }

  protected toEntity(doc: unknown): PropertyTenant {
    return new PropertyTenant(doc as Partial<PropertyTenant>);
  }
}
