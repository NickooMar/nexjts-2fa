import { BaseEntity } from 'libs/shared/repositories/base.entity';

/**
 * Per-organization feature override. Entitlements are computed as
 * `plan.features` merged with these flags, letting support/sales grant or
 * revoke a single capability (e.g. a beta or an enterprise add-on) without
 * cloning plans. `expiresAt` supports time-boxed grants.
 */
export class FeatureFlag extends BaseEntity {
  _id: any;

  organizationId: any;

  key: string;

  enabled: boolean;

  /** Optional expiry; expired flags are ignored when merging entitlements. */
  expiresAt?: Date | null;

  /** Why the override exists (audit). */
  reason?: string;

  createdBy?: any;

  createdAt: Date;

  updatedAt: Date;
}
