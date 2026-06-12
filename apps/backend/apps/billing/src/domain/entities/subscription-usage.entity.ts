import { BaseEntity } from 'libs/shared/repositories/base.entity';

/** Lifetime counters live under this sentinel period. */
export const LIFETIME_PERIOD = 'lifetime';

/**
 * Usage counters for one organization and one period.
 *
 * - `period: 'lifetime'` rows hold gauges that track current state
 *   (properties, members, storageBytes, activeListings).
 * - `period: 'YYYY-MM'` rows hold monthly meters that reset naturally by
 *   keying on the month (apiRequests, fileUploads, leads).
 *
 * Counters are an open map updated with atomic `$inc`, so new metrics need no
 * migration. Gauges are event-sourced from domain events and periodically
 * reconciled against authoritative sources (SYNC_USAGE) to correct drift.
 */
export class SubscriptionUsage extends BaseEntity {
  _id: any;

  organizationId: any;

  period: string;

  counters: Record<string, number>;

  /** Last authoritative reconciliation (SYNC_USAGE) timestamp. */
  syncedAt?: Date | null;

  createdAt: Date;

  updatedAt: Date;
}
