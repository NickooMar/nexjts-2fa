import { SchemaFactory } from '@nestjs/mongoose';
import { PropertyContactDocument } from './property-contact.schema';

/**
 * A person renting/occupying a property — *not* the control-plane `Tenant`
 * (organization) document. Lives in the tenant's own database. Shares its
 * shape with {@link PropertyContactDocument}.
 */
export class PropertyTenantDocument extends PropertyContactDocument {}

export const PropertyTenantSchema = SchemaFactory.createForClass(
  PropertyTenantDocument,
);
