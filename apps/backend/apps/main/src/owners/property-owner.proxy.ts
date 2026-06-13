import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Clients, PropertyOwnerPatterns } from 'apps/constants';
import {
  PropertyContactProxy,
  ContactPatternSet,
} from '../common/property-contact.proxy';

/**
 * Gateway-side proxy to the property-owner handlers in the user service.
 * Behaviour is shared via {@link PropertyContactProxy}.
 */
@Injectable()
export class PropertyOwnerProxy extends PropertyContactProxy {
  protected readonly patterns: ContactPatternSet = PropertyOwnerPatterns;

  constructor(
    @Inject(Clients.USER_CLIENT)
    userClient: ClientProxy,
  ) {
    super(userClient);
  }
}
