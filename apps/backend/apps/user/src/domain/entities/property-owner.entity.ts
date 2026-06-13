import { PropertyContact } from './property-contact.entity';

/**
 * A person who owns a property. Shares its shape with {@link PropertyContact};
 * stored in its own collection so owners and tenants are independent rosters.
 */
export class PropertyOwner extends PropertyContact {}
