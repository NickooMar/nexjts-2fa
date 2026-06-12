import { randomUUID } from 'crypto';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  Clients,
  BillingCycle,
  BillingPatterns,
  BillingEventPatterns,
} from 'apps/constants';

/**
 * Gateway-side proxy to the billing service. `organizationId` is always the
 * tenant id resolved from the JWT by the gateway — never client input.
 *
 * `emitUsageEvent` is fire-and-forget (`emit`, not `send`): usage tracking
 * must never add latency or failure modes to the underlying operation.
 */
@Injectable()
export class BillingProxy {
  private readonly logger = new Logger(BillingProxy.name);

  constructor(
    @Inject(Clients.BILLING_CLIENT)
    private readonly billingClient: ClientProxy,
  ) {}

  private forwardRpcError<T>() {
    return catchError<T, Observable<never>>((error) => {
      if (error instanceof RpcException) {
        return throwError(() => error);
      }
      return throwError(() => new RpcException(error.message));
    });
  }

  /* ---------------------------------------------------------------- plans */

  listPlans(): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.LIST_PLANS }, {})
      .pipe(this.forwardRpcError());
  }

  /* -------------------------------------------------------- subscription */

  getSubscription(organizationId: string): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.GET_SUBSCRIPTION }, { organizationId })
      .pipe(this.forwardRpcError());
  }

  getEntitlements(organizationId: string): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.GET_ENTITLEMENTS }, { organizationId })
      .pipe(this.forwardRpcError());
  }

  checkout(
    organizationId: string,
    planSlug: string,
    billingCycle: BillingCycle,
    userId?: string,
  ): Observable<any> {
    return this.billingClient
      .send(
        { cmd: BillingPatterns.CHECKOUT },
        { organizationId, planSlug, billingCycle, userId },
      )
      .pipe(this.forwardRpcError());
  }

  changePlan(
    organizationId: string,
    planSlug: string,
    billingCycle: BillingCycle,
    userId?: string,
  ): Observable<any> {
    return this.billingClient
      .send(
        { cmd: BillingPatterns.CHANGE_PLAN },
        { organizationId, planSlug, billingCycle, userId },
      )
      .pipe(this.forwardRpcError());
  }

  cancelSubscription(organizationId: string): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.CANCEL_SUBSCRIPTION }, { organizationId })
      .pipe(this.forwardRpcError());
  }

  resumeSubscription(organizationId: string): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.RESUME_SUBSCRIPTION }, { organizationId })
      .pipe(this.forwardRpcError());
  }

  retryPayment(organizationId: string): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.RETRY_PAYMENT }, { organizationId })
      .pipe(this.forwardRpcError());
  }

  /* --------------------------------------------------------------- usage */

  getUsage(organizationId: string): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.GET_USAGE }, { organizationId })
      .pipe(this.forwardRpcError());
  }

  checkLimit(input: {
    organizationId: string;
    limitKey: string;
    delta?: number;
    current?: number;
  }): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.CHECK_LIMIT }, input)
      .pipe(this.forwardRpcError());
  }

  syncUsage(
    organizationId: string,
    gauges: Record<string, number>,
  ): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.SYNC_USAGE }, { organizationId, gauges })
      .pipe(this.forwardRpcError());
  }

  /* ------------------------------------------------------------- history */

  listInvoices(organizationId: string): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.LIST_INVOICES }, { organizationId })
      .pipe(this.forwardRpcError());
  }

  listPayments(organizationId: string): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.LIST_PAYMENTS }, { organizationId })
      .pipe(this.forwardRpcError());
  }

  /* ------------------------------------------------------------ webhooks */

  handleWebhook(payload: {
    provider?: string;
    body: unknown;
    headers: Record<string, string>;
  }): Observable<any> {
    return this.billingClient
      .send({ cmd: BillingPatterns.HANDLE_WEBHOOK }, payload)
      .pipe(this.forwardRpcError());
  }

  /* -------------------------------------------------------------- events */

  /**
   * Fire-and-forget usage event. Adds a unique eventId for consumer-side
   * dedup and swallows emit errors (counters self-heal via SYNC_USAGE).
   */
  emitUsageEvent(
    pattern: (typeof BillingEventPatterns)[keyof typeof BillingEventPatterns],
    event: { organizationId: string; quantity?: number; bytes?: number },
  ): void {
    try {
      this.billingClient
        .emit(pattern, { ...event, eventId: randomUUID() })
        .subscribe({
          error: (error) =>
            this.logger.warn(`Usage event ${pattern} not delivered: ${error}`),
        });
    } catch (error) {
      this.logger.warn(`Usage event ${pattern} not emitted: ${error}`);
    }
  }
}
