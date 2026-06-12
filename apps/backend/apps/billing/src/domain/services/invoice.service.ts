import { Injectable } from '@nestjs/common';
import {
  InvoiceStatuses,
  PaymentStatuses,
  PaymentProviderName,
} from 'apps/constants';
import { Plan } from '../entities/plan.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { Subscription } from '../entities/subscription.entity';
import { InvoiceRepository } from '../../infrastructure/repository/invoice.repository';
import { PaymentRepository } from '../../infrastructure/repository/payment.repository';

/**
 * Owns the money records: invoices and their payment attempts. The
 * subscription lifecycle calls in here whenever a charge happens (checkout,
 * renewal, retry) so billing history is complete and auditable.
 */
@Injectable()
export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  listInvoices(organizationId: string): Promise<Invoice[]> {
    return this.invoiceRepository.findByOrganization(organizationId);
  }

  listPayments(organizationId: string): Promise<Payment[]> {
    return this.paymentRepository.findByOrganization(organizationId);
  }

  findLatestOpen(organizationId: string): Promise<Invoice | null> {
    return this.invoiceRepository.findLatestOpen(organizationId);
  }

  /**
   * Create the invoice for one subscription period and record the charge
   * attempt against it. Returns both rows; the invoice is `paid` only when
   * the charge succeeded.
   */
  async recordCharge(params: {
    subscription: Subscription;
    plan: Plan;
    amount: number;
    currency: string;
    periodStart: Date;
    periodEnd: Date;
    provider: PaymentProviderName;
    succeeded: boolean;
    providerPaymentId?: string;
    failureReason?: string;
    description?: string;
  }): Promise<{ invoice: Invoice; payment: Payment }> {
    const { subscription, plan } = params;
    const number = await this.invoiceRepository.nextInvoiceNumber();

    const invoice = await this.invoiceRepository.create({
      organizationId: subscription.organizationId,
      subscriptionId: subscription._id,
      number,
      status: params.succeeded
        ? InvoiceStatuses.PAID
        : InvoiceStatuses.OPEN,
      lineItems: [
        {
          description:
            params.description ??
            `${plan.name} plan (${subscription.billingCycle})`,
          quantity: 1,
          unitAmount: params.amount,
          amount: params.amount,
        },
      ],
      subtotal: params.amount,
      tax: 0,
      total: params.amount,
      currency: params.currency,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      dueDate: params.succeeded ? null : new Date(),
      paidAt: params.succeeded ? new Date() : null,
      provider: params.provider,
    } as any);

    const payment = await this.recordAttempt({
      invoice,
      succeeded: params.succeeded,
      providerPaymentId: params.providerPaymentId,
      failureReason: params.failureReason,
    });

    return { invoice, payment };
  }

  /** Record one (re)charge attempt against an existing invoice. */
  async recordAttempt(params: {
    invoice: Invoice;
    succeeded: boolean;
    providerPaymentId?: string;
    failureReason?: string;
  }): Promise<Payment> {
    const attempts = await this.paymentRepository.countAttempts(
      String(params.invoice._id),
    );
    return this.paymentRepository.create({
      organizationId: params.invoice.organizationId,
      invoiceId: params.invoice._id,
      subscriptionId: params.invoice.subscriptionId,
      amount: params.invoice.total,
      currency: params.invoice.currency,
      status: params.succeeded
        ? PaymentStatuses.SUCCEEDED
        : PaymentStatuses.FAILED,
      provider: params.invoice.provider,
      providerPaymentId: params.providerPaymentId,
      attempt: attempts + 1,
      failureReason: params.failureReason ?? null,
    } as any);
  }

  async markPaid(invoiceId: string): Promise<Invoice | null> {
    return this.invoiceRepository.update(invoiceId, {
      status: InvoiceStatuses.PAID,
      paidAt: new Date(),
    });
  }
}
