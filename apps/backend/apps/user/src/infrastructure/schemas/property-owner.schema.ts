import { SchemaFactory } from '@nestjs/mongoose';
import { PropertyContactDocument } from './property-contact.schema';

/**
 * A person who owns a property. Lives in the tenant's own database, in its own
 * collection (separate roster from renters). Shares its shape with
 * {@link PropertyContactDocument}.
 */
export class PropertyOwnerDocument extends PropertyContactDocument {}

export const PropertyOwnerSchema = SchemaFactory.createForClass(
  PropertyOwnerDocument,
);
