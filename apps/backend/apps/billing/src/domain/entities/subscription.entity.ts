import {
  BillingCycle,
  SubscriptionStatus,
  PaymentProviderName,
} from 'apps/constants';
import { BaseEntity } from 'libs/shared/repositories/base.entity';

/**
 * An organization's subscription to a plan. Strictly organization-scoped:
 * `organizationId` references the control-plane Tenant document, never a
 * user, so membership changes and ownership transfers cannot affect it.
 *
 * History is preserved: plan changes and cancellations close the current row
 * (`isCurrent: false`) and open a new one, so the collection doubles as the
 * subscription audit trail.
 */
export class Subscription extends BaseEntity {
  _id: any;

  organizationId: any;

  planId: any;

  status: SubscriptionStatus;

  billingCycle: BillingCycle;

  /** Exactly one current subscription per organization (partial unique index). */
  isCurrent: boolean;

  currentPeriodStart: Date;

  currentPeriodEnd: Date;

  trialEndsAt?: Date | null;

  /** When true the subscription lapses (→ expired) at period end. */
  cancelAtPeriodEnd: boolean;

  cancelledAt?: Date | null;

  /** First moment a renewal charge failed (drives past_due → suspended). */
  pastDueSince?: Date | null;

  provider: PaymentProviderName;

  providerCustomerId?: string;

  providerSubscriptionId?: string;

  createdBy?: any;

  deletedAt?: Date | null;

  createdAt: Date;

  updatedAt: Date;
}
