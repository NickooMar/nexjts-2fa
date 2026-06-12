import { BaseEntity } from 'libs/shared/repositories/base.entity';
import { PropertyType } from '../../infrastructure/schemas/property.schema';

export class Property extends BaseEntity {
  _id: any;

  uuid: string;

  organizationId: any;

  name: string;

  slug: string;

  description?: string;

  address: string;

  city?: string;

  state?: string;

  stateCode?: string;

  country?: string;

  postalCode?: string;

  type: PropertyType;

  units: number;

  createdBy: any;

  createdAt: Date;

  updatedAt: Date;
}
