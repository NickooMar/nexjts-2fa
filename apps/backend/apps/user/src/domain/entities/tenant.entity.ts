import { BaseEntity } from 'libs/shared/repositories/base.entity';
import { TenantStatus } from '../../infrastructure/schemas/tenant.schema';

export class Tenant extends BaseEntity {
  _id: any;

  name: string;

  slug: string;

  dbName: string;

  status: TenantStatus;

  ownerId: any;

  website?: string;

  phone?: string;

  country?: string;

  createdAt: Date;

  updatedAt: Date;
}
