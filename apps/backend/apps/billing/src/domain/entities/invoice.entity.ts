import { InvoiceStatus, PaymentProviderName } from 'apps/constants';
import { BaseEntity } from 'libs/shared/repositories/base.entity';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  /** Minor units (cents). */
  unitAmount: number;
  amount: number;
}

export class Invoice extends BaseEntity {
  _id: any;

  organizationId: any;

  subscriptionId: any;

  /** Human-readable sequential number (`INV-2026-000042`). */
  number: string;

  status: InvoiceStatus;

  lineItems: InvoiceLineItem[];

  /** All amounts in minor units (cents). */
  subtotal: number;

  tax: number;

  total: number;

  currency: string;

  periodStart: Date;

  periodEnd: Date;

  dueDate?: Date | null;

  paidAt?: Date | null;

  provider: PaymentProviderName;

  providerInvoiceId?: string;

  deletedAt?: Date | null;

  createdAt: Date;

  updatedAt: Date;
}
