import { BaseEntity } from 'libs/shared/repositories/base.entity';
import {
  MembershipRole,
  MembershipStatus,
} from '../../infrastructure/schemas/membership.schema';

export class Membership extends BaseEntity {
  _id: any;

  userId: any;

  tenantId: any;

  role: MembershipRole;

  status: MembershipStatus;

  isPrimary: boolean;

  createdAt: Date;

  updatedAt: Date;
}

/** A membership enriched with its tenant's display fields, for the org switcher. */
export class UserOrganization {
  tenantId: string;

  name: string;

  slug: string;

  role: MembershipRole;

  isPrimary: boolean;
}

/** A membership enriched with the member's user fields, for the members list. */
export class UserMember {
  userId: string;

  email: string;

  firstName: string;

  lastName: string;

  role: MembershipRole;

  status: MembershipStatus;

  isPrimary: boolean;
}
