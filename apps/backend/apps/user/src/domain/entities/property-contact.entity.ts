import { BaseEntity } from 'libs/shared/repositories/base.entity';

/**
 * A person associated with one or more properties — the shared shape behind
 * both {@link PropertyTenant} (renter/occupant) and `PropertyOwner`. Lives in
 * the tenant's own database; the property link is a plain id array so the
 * person can exist standalone and be attached to / detached from many
 * properties without losing their record.
 */
export class PropertyContact extends BaseEntity {
  _id: any;

  uuid: string;

  fullName: string;

  email?: string;

  phone?: string;

  documentId?: string;

  notes?: string;

  propertyIds: any[];

  createdBy?: any;

  createdAt: Date;

  updatedAt: Date;
}
