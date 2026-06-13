import { PropertyContact } from './property-contact.entity';

/**
 * A person renting/occupying a property — *not* the control-plane `Tenant`
 * (organization) document. Shares its shape with {@link PropertyContact}.
 */
export class PropertyTenant extends PropertyContact {}
