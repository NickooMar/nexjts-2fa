import { Injectable } from '@nestjs/common';
import { PropertyTenant } from '../entities/property-tenant.entity';
import { PropertyContactService } from './property-contact.service';
import { PropertyTenantRepository } from '../../infrastructure/repository/property-tenant.repository';

/** Renters/occupants. Behaviour is shared via {@link PropertyContactService}. */
@Injectable()
export class PropertyTenantService extends PropertyContactService<PropertyTenant> {
  protected readonly notFoundCode = 'property_tenant_not_found';

  constructor(protected readonly repository: PropertyTenantRepository) {
    super();
  }
}
