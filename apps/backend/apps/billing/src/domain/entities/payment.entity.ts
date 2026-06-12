import { PaymentProviderName, PaymentStatus } from 'apps/constants';
import { BaseEntity } from 'libs/shared/repositories/base.entity';

/** One charge attempt against an invoice (retries create new rows). */
export class Payment extends BaseEntity {
  _id: any;

  organizationId: any;

  invoiceId: any;

  subscriptionId: any;

  /** Minor units (cents). */
  amount: number;

  currency: string;

  status: PaymentStatus;

  provider: PaymentProviderName;

  providerPaymentId?: string;

  /** 1 for the first attempt, incremented on each retry of the invoice. */
  attempt: number;

  failureReason?: string | null;

  refundedAt?: Date | null;

  deletedAt?: Date | null;

  createdAt: Date;

  updatedAt: Date;
}
