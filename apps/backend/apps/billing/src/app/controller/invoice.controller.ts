import { Observable, from } from 'rxjs';
import { Controller } from '@nestjs/common';
import { BillingPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { Invoice } from '../../domain/entities/invoice.entity';
import { Payment } from '../../domain/entities/payment.entity';
import { InvoiceService } from '../../domain/services/invoice.service';

/** Billing history reads (invoices + payment attempts). */
@Controller()
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @MessagePattern({ cmd: BillingPatterns.LIST_INVOICES })
  listInvoices(payload: { organizationId: string }): Observable<Invoice[]> {
    return from(this.invoiceService.listInvoices(payload.organizationId));
  }

  @MessagePattern({ cmd: BillingPatterns.LIST_PAYMENTS })
  listPayments(payload: { organizationId: string }): Observable<Payment[]> {
    return from(this.invoiceService.listPayments(payload.organizationId));
  }
}
