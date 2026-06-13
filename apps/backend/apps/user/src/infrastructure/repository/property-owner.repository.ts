import { Schema } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { PropertyOwner } from '../../domain/entities/property-owner.entity';
import { PropertyOwnerSchema } from '../schemas/property-owner.schema';
import { TenantConnectionService } from '../tenancy/tenant-connection.service';
import { PropertyContactRepository } from './property-contact.repository';

/**
 * Property-owner data lives in the tenant's own database. Behaviour is shared
 * with {@link PropertyContactRepository}; only the collection differs.
 */
@Injectable()
export class PropertyOwnerRepository extends PropertyContactRepository<PropertyOwner> {
  protected readonly modelName = 'PropertyOwner';
  protected readonly schema: Schema = PropertyOwnerSchema;

  constructor(tenantConnection: TenantConnectionService) {
    super(tenantConnection);
  }

  protected toEntity(doc: unknown): PropertyOwner {
    return new PropertyOwner(doc as Partial<PropertyOwner>);
  }
}
