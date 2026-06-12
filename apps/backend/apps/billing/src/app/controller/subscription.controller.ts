import { Observable, from } from 'rxjs';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { BillingCycle, BillingPatterns } from 'apps/constants';
import {
  SubscriptionService,
  SubscriptionOverview,
} from '../../domain/services/subscription.service';

/**
 * Subscription lifecycle, keyed strictly by organizationId (the gateway
 * derives it from the JWT — clients can never bill another organization).
 */
@Controller()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @MessagePattern({ cmd: BillingPatterns.GET_SUBSCRIPTION })
  getSubscription(payload: {
    organizationId: string;
  }): Observable<SubscriptionOverview> {
    return from(this.subscriptionService.getOverview(payload.organizationId));
  }

  @MessagePattern({ cmd: BillingPatterns.GET_ENTITLEMENTS })
  getEntitlements(payload: { organizationId: string }): Observable<any> {
    return from(
      this.subscriptionService.getEntitlements(payload.organizationId),
    );
  }

  @MessagePattern({ cmd: BillingPatterns.CHECKOUT })
  checkout(payload: {
    organizationId: string;
    planSlug: string;
    billingCycle: BillingCycle;
    userId?: string;
  }): Observable<SubscriptionOverview & { checkoutUrl?: string }> {
    return from(this.subscriptionService.checkout(payload));
  }

  @MessagePattern({ cmd: BillingPatterns.CHANGE_PLAN })
  changePlan(payload: {
    organizationId: string;
    planSlug: string;
    billingCycle: BillingCycle;
    userId?: string;
  }): Observable<SubscriptionOverview> {
    return from(this.subscriptionService.changePlan(payload));
  }

  @MessagePattern({ cmd: BillingPatterns.CANCEL_SUBSCRIPTION })
  cancel(payload: { organizationId: string }): Observable<SubscriptionOverview> {
    return from(this.subscriptionService.cancel(payload.organizationId));
  }

  @MessagePattern({ cmd: BillingPatterns.RESUME_SUBSCRIPTION })
  resume(payload: { organizationId: string }): Observable<SubscriptionOverview> {
    return from(this.subscriptionService.resume(payload.organizationId));
  }

  @MessagePattern({ cmd: BillingPatterns.RETRY_PAYMENT })
  retryPayment(payload: {
    organizationId: string;
  }): Observable<SubscriptionOverview> {
    return from(this.subscriptionService.retryPayment(payload.organizationId));
  }

  /** Cron/ops hook: advance every subscription with a due transition. */
  @MessagePattern({ cmd: BillingPatterns.RUN_LIFECYCLE })
  runLifecycle(): Observable<{ processed: number }> {
    return from(this.subscriptionService.runLifecycleSweep());
  }
}
