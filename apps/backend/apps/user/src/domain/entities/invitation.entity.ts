import { BaseEntity } from 'libs/shared/repositories/base.entity';
import { OrganizationRole } from 'apps/constants';
import { InvitationStatus } from '../../infrastructure/schemas/invitation.schema';

export class Invitation extends BaseEntity {
  _id: any;

  code: string;

  tenantId: any;

  role: OrganizationRole;

  status: InvitationStatus;

  expiresAt: Date;

  createdBy: any;

  acceptedBy: any;

  createdAt: Date;

  updatedAt: Date;
}
