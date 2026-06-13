import { CreatePropertyContactDto } from '../property-contact/property-contact.dto';

/**
 * A property tenant (renter/occupant) living in the tenant database. Distinct
 * from the control-plane `Tenant` (organization) document. Shares its shape
 * with {@link CreatePropertyContactDto}.
 */
export class CreatePropertyTenantDto extends CreatePropertyContactDto {}
