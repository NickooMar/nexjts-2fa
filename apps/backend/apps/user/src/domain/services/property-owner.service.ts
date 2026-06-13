import { Injectable } from '@nestjs/common';
import { PropertyOwner } from '../entities/property-owner.entity';
import { PropertyContactService } from './property-contact.service';
import { PropertyOwnerRepository } from '../../infrastructure/repository/property-owner.repository';

/** Property owners. Behaviour is shared via {@link PropertyContactService}. */
@Injectable()
export class PropertyOwnerService extends PropertyContactService<PropertyOwner> {
  protected readonly notFoundCode = 'property_owner_not_found';

  constructor(protected readonly repository: PropertyOwnerRepository) {
    super();
  }
}
