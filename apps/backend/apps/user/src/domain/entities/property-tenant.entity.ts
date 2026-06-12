import { BaseEntity } from 'libs/shared/repositories/base.entity';

export class PropertyTenant extends BaseEntity {
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
