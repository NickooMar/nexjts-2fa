import { BillingCycle } from 'apps/constants';
import { BaseEntity } from 'libs/shared/repositories/base.entity';

export interface PlanPrice {
  /** Minor units (cents) to avoid floating point drift. */
  amount: number;
  currency: string;
}

/**
 * A sellable plan. Limits and features are open maps stored as-is in Mongo,
 * so adding a new limit ("maxWhatever") or feature toggle is a data change,
 * never a schema migration. `UNLIMITED` (-1) means no cap.
 */
export class Plan extends BaseEntity {
  _id: any;

  name: string;

  /** Stable machine identifier (`free`, `starter`, `pro`, …). */
  slug: string;

  description?: string;

  prices: Partial<Record<BillingCycle, PlanPrice>>;

  /** `{ properties: 5, storageGb: 1, members: 3, … }` — -1 = unlimited. */
  limits: Record<string, number>;

  /** `{ crm: true, analytics: false, … }` feature toggles. */
  features: Record<string, boolean>;

  /** Days of free trial granted on first subscription (0 = none). */
  trialDays: number;

  /** Hidden plans (custom/enterprise deals) are not publicly listable. */
  isPublic: boolean;

  /** Archived plans keep serving existing subscribers but cannot be sold. */
  archivedAt?: Date | null;

  sortOrder: number;

  createdBy?: any;

  createdAt: Date;

  updatedAt: Date;
}
