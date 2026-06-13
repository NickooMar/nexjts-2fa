import { CreatePropertyContactDto } from '../property-contact/property-contact.dto';

/**
 * A property owner living in the tenant database. Shares its shape with
 * {@link CreatePropertyContactDto}; stored in a separate roster from tenants.
 */
export class CreatePropertyOwnerDto extends CreatePropertyContactDto {}
