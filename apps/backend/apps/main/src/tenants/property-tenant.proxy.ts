import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Clients, PropertyTenantPatterns } from 'apps/constants';
import {
  PropertyContactProxy,
  ContactPatternSet,
} from '../common/property-contact.proxy';

/**
 * Gateway-side proxy to the property-tenant (renter) handlers in the user
 * service. Behaviour is shared via {@link PropertyContactProxy}.
 */
@Injectable()
export class PropertyTenantProxy extends PropertyContactProxy {
  protected readonly patterns: ContactPatternSet = PropertyTenantPatterns;

  constructor(
    @Inject(Clients.USER_CLIENT)
    userClient: ClientProxy,
  ) {
    super(userClient);
  }
}
