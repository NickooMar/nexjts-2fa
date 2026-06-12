import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  BillingCycle,
  BillingCycles,
  PlanLimitKeys,
  SubscriptionStatus,
  SubscriptionStatuses,
} from 'apps/constants';
import { Plan, PlanPrice } from '../entities/plan.entity';
import { Subscription } from '../entities/subscription.entity';
import { PlanService } from './plan.service';
import { InvoiceService } from './invoice.service';
import { EntitlementService, Entitlements } from './entitlement.service';
import { PaymentProviderFactory } from '../../infrastructure/providers/payment-provider.factory';
import { NormalizedWebhookEvent } from '../contracts/payment-provider.abstract';
import { SubscriptionRepository } from '../../infrastructure/repository/subscription.repository';
import { SubscriptionUsageRepository } from '../../infrastructure/repository/subscription-usage.repository';

export interface SubscriptionOverview {
  subscription: Subscription;
  plan: Plan;
  entitlements: Entitlements;
}

/**
 * Legal state machine. `expired` is terminal: a new row (e.g. the free
 * fallback subscription) replaces it rather than mutating it back to life.
 */
const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  [SubscriptionStatuses.TRIALING]: [
    SubscriptionStatuses.ACTIVE,
    SubscriptionStatuses.PAST_DUE,
    SubscriptionStatuses.CANCELLED,
    SubscriptionStatuses.EXPIRED,
  ],
  [SubscriptionStatuses.ACTIVE]: [
    SubscriptionStatuses.PAST_DUE,
    SubscriptionStatuses.SUSPENDED,
    SubscriptionStatuses.CANCELLED,
    SubscriptionStatuses.EXPIRED,
  ],
  [SubscriptionStatuses.PAST_DUE]: [
    SubscriptionStatuses.ACTIVE,
    SubscriptionStatuses.SUSPENDED,
    SubscriptionStatuses.CANCELLED,
    SubscriptionStatuses.EXPIRED,
  ],
  [SubscriptionStatuses.SUSPENDED]: [
    SubscriptionStatuses.ACTIVE,
    SubscriptionStatuses.CANCELLED,
    SubscriptionStatuses.EXPIRED,
  ],
  [SubscriptionStatuses.CANCELLED]: [
    SubscriptionStatuses.ACTIVE,
    SubscriptionStatuses.EXPIRED,
  ],
  [SubscriptionStatuses.EXPIRED]: [],
};

/** Gauge limits checked when downgrading (limit key → usage counter key). */
const DOWNGRADE_GUARDS: Array<{ limitKey: string; counterKey: string }> = [
  { limitKey: PlanLimitKeys.PROPERTIES, counterKey: 'properties' },
  { limitKey: PlanLimitKeys.MEMBERS, counterKey: 'members' },
  { limitKey: PlanLimitKeys.ACTIVE_LISTINGS, counterKey: 'activeListings' },
];

const GB = 1024 * 1024 * 1024;
/** Safety bound when rolling periods forward after long downtime. */
const MAX_RENEWALS_PER_SWEEP = 24;

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly planService: PlanService,
    private readonly invoiceService: InvoiceService,
    private readonly entitlementService: EntitlementService,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly usageRepository: SubscriptionUsageRepository,
    private readonly configService: ConfigService,
  ) {}

  /* ---------------------------------------------------------------- reads */

  /**
   * The single read path: returns the organization's current subscription,
   * auto-provisioning the default plan for organizations that predate billing
   * (or whose paid subscription lapsed), and lazily applying every time-based
   * transition that became due since the last read.
   */
  async getOverview(organizationId: string): Promise<SubscriptionOverview> {
    let subscription =
      await this.subscriptionRepository.findCurrentByOrganization(
        organizationId,
      );
    if (!subscription) {
      subscription = await this.provisionDefault(organizationId);
    }

    subscription = await this.advanceLifecycle(subscription);
    const plan = await this.planService.getById(String(subscription.planId));
    const entitlements = await this.entitlementService.build(
      subscription,
      plan,
    );
    return { subscription, plan, entitlements };
  }

  async getEntitlements(organizationId: string): Promise<Entitlements> {
    const cached = this.entitlementService.getCached(organizationId);
    if (cached) return cached;
    const { entitlements } = await this.getOverview(organizationId);
    return entitlements;
  }

  /* ----------------------------------------------------------- lifecycle */

  /** Default (free) subscription for organizations without one. */
  async provisionDefault(organizationId: string): Promise<Subscription> {
    const defaultSlug = this.configService.get<string>(
      'BILLING_DEFAULT_PLAN',
      'free',
    );
    const plan = await this.planService.getBySlug(defaultSlug);
    const now = new Date();
    this.logger.log(
      `Provisioning default plan "${plan.slug}" for organization ${organizationId}`,
    );
    return this.subscriptionRepository.create({
      organizationId,
      planId: plan._id,
      status: SubscriptionStatuses.ACTIVE,
      billingCycle: BillingCycles.MONTHLY,
      isCurrent: true,
      currentPeriodStart: now,
      currentPeriodEnd: this.addCycle(now, BillingCycles.MONTHLY),
      provider: this.providerFactory.getProvider().name,
    } as any);
  }

  /**
   * Apply due time-based transitions: trial end, renewals, past-due grace
   * expiry, and cancellation lapse. Called lazily on every read and by the
   * RUN_LIFECYCLE sweep (cron), so state is correct even without a scheduler.
   */
  async advanceLifecycle(subscription: Subscription): Promise<Subscription> {
    const now = new Date();
    let current = subscription;

    // Trial ended → convert to paid (charge) or fall past_due.
    if (
      current.status === SubscriptionStatuses.TRIALING &&
      current.trialEndsAt &&
      new Date(current.trialEndsAt) <= now
    ) {
      current = await this.settleRenewal(current, new Date(current.trialEndsAt));
    }

    // Period rolled over → renew (idempotent; capped for safety).
    let renewals = 0;
    while (
      (current.status === SubscriptionStatuses.ACTIVE ||
        current.status === SubscriptionStatuses.TRIALING) &&
      new Date(current.currentPeriodEnd) <= now &&
      renewals < MAX_RENEWALS_PER_SWEEP
    ) {
      if (current.cancelAtPeriodEnd) {
        return this.lapseAndFallback(current, SubscriptionStatuses.CANCELLED);
      }
      current = await this.settleRenewal(
        current,
        new Date(current.currentPeriodEnd),
      );
      renewals += 1;
    }

    // Unpaid beyond the grace window → suspend service.
    if (
      current.status === SubscriptionStatuses.PAST_DUE &&
      current.pastDueSince
    ) {
      const graceDays = this.configService.get<number>(
        'BILLING_PAST_DUE_GRACE_DAYS',
        7,
      );
      const suspendAt = new Date(current.pastDueSince);
      suspendAt.setDate(suspendAt.getDate() + Number(graceDays));
      if (suspendAt <= now) {
        current = await this.transition(current, SubscriptionStatuses.SUSPENDED);
      }
    }

    return current;
  }

  /** Sweep entry point for an external scheduler (RUN_LIFECYCLE pattern). */
  async runLifecycleSweep(): Promise<{ processed: number }> {
    const due = await this.subscriptionRepository.findDueForLifecycle(
      new Date(),
    );
    for (const subscription of due) {
      try {
        await this.advanceLifecycle(subscription);
      } catch (error) {
        this.logger.error(
          `Lifecycle failed for subscription ${subscription._id}: ${error}`,
        );
      }
    }
    return { processed: due.length };
  }

  /* ------------------------------------------------------------ commands */

  /**
   * Subscribe the organization to a (paid) plan. With a synchronous provider
   * (mock / saved card) the subscription activates immediately; redirect
   * providers return a `checkoutUrl` and activate later via webhook.
   */
  async checkout(params: {
    organizationId: string;
    planSlug: string;
    billingCycle: BillingCycle;
    userId?: string;
  }): Promise<SubscriptionOverview & { checkoutUrl?: string }> {
    const { organizationId, billingCycle } = params;
    const plan = await this.planService.getBySlug(params.planSlug);
    if (plan.archivedAt) throw new RpcException('plan_not_available');
    const price = this.priceFor(plan, billingCycle);

    const { subscription: existing } = await this.getOverview(organizationId);
    if (
      String(existing.planId) === String(plan._id) &&
      existing.billingCycle === billingCycle &&
      !existing.cancelAtPeriodEnd
    ) {
      throw new RpcException('already_subscribed');
    }

    // One trial per organization, ever.
    const history =
      await this.subscriptionRepository.findHistory(organizationId);
    const hadTrial = history.some((row) => row.trialEndsAt);
    const now = new Date();

    if (plan.trialDays > 0 && !hadTrial && price.amount > 0) {
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays);
      const subscription = await this.replaceCurrent(existing, {
        organizationId,
        planId: plan._id,
        status: SubscriptionStatuses.TRIALING,
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt,
        trialEndsAt,
        provider: this.providerFactory.getProvider().name,
        createdBy: params.userId,
      });
      return this.overviewFor(subscription, plan);
    }

    const provider = this.providerFactory.getProvider();
    const result = await provider.createCheckout({
      organizationId,
      planSlug: plan.slug,
      billingCycle,
      amount: price.amount,
      currency: price.currency,
    });

    if (result.outcome === 'failed') {
      throw new RpcException(result.failureReason ?? 'payment_failed');
    }
    if (result.outcome === 'pending') {
      // Redirect flow: current subscription stays until the webhook confirms.
      const overview = await this.getOverview(organizationId);
      return { ...overview, checkoutUrl: result.checkoutUrl };
    }

    const periodEnd = this.addCycle(now, billingCycle);
    const subscription = await this.replaceCurrent(existing, {
      organizationId,
      planId: plan._id,
      status: SubscriptionStatuses.ACTIVE,
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      provider: provider.name,
      providerCustomerId: result.providerCustomerId,
      providerSubscriptionId: result.providerSubscriptionId,
      createdBy: params.userId,
    });

    if (price.amount > 0) {
      await this.invoiceService.recordCharge({
        subscription,
        plan,
        amount: price.amount,
        currency: price.currency,
        periodStart: now,
        periodEnd,
        provider: provider.name,
        succeeded: true,
        providerPaymentId: result.providerPaymentId,
      });
    }

    return this.overviewFor(subscription, plan);
  }

  /**
   * Upgrade/downgrade. Changes apply immediately; upgrades charge the new
   * price now (simplification: no proration credit — documented). Downgrades
   * are blocked while current usage exceeds the target plan's limits, so an
   * organization can never end up out of contract.
   */
  async changePlan(params: {
    organizationId: string;
    planSlug: string;
    billingCycle: BillingCycle;
    userId?: string;
  }): Promise<SubscriptionOverview> {
    const { organizationId, billingCycle } = params;
    const target = await this.planService.getBySlug(params.planSlug);
    if (target.archivedAt) throw new RpcException('plan_not_available');
    const price = this.priceFor(target, billingCycle);

    const { subscription: existing, plan: currentPlan } =
      await this.getOverview(organizationId);
    if (
      String(existing.planId) === String(target._id) &&
      existing.billingCycle === billingCycle
    ) {
      throw new RpcException('already_subscribed');
    }

    await this.assertUsageFitsPlan(organizationId, target);

    const provider = this.providerFactory.getProvider();
    let providerPaymentId: string | undefined;
    if (price.amount > 0) {
      const charge = await provider.charge({
        organizationId,
        amount: price.amount,
        currency: price.currency,
        description: `Plan change ${currentPlan.slug} → ${target.slug}`,
        providerCustomerId: existing.providerCustomerId,
      });
      if (charge.outcome === 'failed') {
        throw new RpcException(charge.failureReason ?? 'payment_failed');
      }
      providerPaymentId = charge.providerPaymentId;
    }

    const now = new Date();
    const periodEnd = this.addCycle(now, billingCycle);
    const subscription = await this.replaceCurrent(existing, {
      organizationId,
      planId: target._id,
      status: SubscriptionStatuses.ACTIVE,
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      provider: provider.name,
      providerCustomerId: existing.providerCustomerId,
      createdBy: params.userId,
    });

    if (price.amount > 0) {
      await this.invoiceService.recordCharge({
        subscription,
        plan: target,
        amount: price.amount,
        currency: price.currency,
        periodStart: now,
        periodEnd,
        provider: provider.name,
        succeeded: true,
        providerPaymentId,
      });
    }

    return this.overviewFor(subscription, target);
  }

  /** Cancel at period end (service continues until then). */
  async cancel(organizationId: string): Promise<SubscriptionOverview> {
    const { subscription, plan } = await this.getOverview(organizationId);
    if (subscription.cancelAtPeriodEnd) {
      throw new RpcException('already_cancelled');
    }
    const provider = this.providerFactory.getProvider();
    await provider
      .cancelRemote(subscription.providerSubscriptionId)
      .catch(() => undefined);

    const updated = await this.subscriptionRepository.update(
      String(subscription._id),
      { cancelAtPeriodEnd: true, cancelledAt: new Date() },
    );
    this.entitlementService.invalidate(organizationId);
    return this.overviewFor(updated, plan);
  }

  /** Undo a pending cancellation before the period lapses. */
  async resume(organizationId: string): Promise<SubscriptionOverview> {
    const { subscription, plan } = await this.getOverview(organizationId);
    if (!subscription.cancelAtPeriodEnd) {
      throw new RpcException('not_cancelled');
    }
    const updated = await this.subscriptionRepository.update(
      String(subscription._id),
      { cancelAtPeriodEnd: false, cancelledAt: null },
    );
    this.entitlementService.invalidate(organizationId);
    return this.overviewFor(updated, plan);
  }

  /** Manual retry of the latest failed/open invoice (past_due/suspended). */
  async retryPayment(organizationId: string): Promise<SubscriptionOverview> {
    const { subscription, plan } = await this.getOverview(organizationId);
    if (
      subscription.status !== SubscriptionStatuses.PAST_DUE &&
      subscription.status !== SubscriptionStatuses.SUSPENDED
    ) {
      throw new RpcException('nothing_to_retry');
    }

    const invoice = await this.invoiceService.findLatestOpen(organizationId);
    if (!invoice) throw new RpcException('nothing_to_retry');

    const provider = this.providerFactory.getProvider();
    const charge = await provider.charge({
      organizationId,
      amount: invoice.total,
      currency: invoice.currency,
      description: `Retry ${invoice.number}`,
      providerCustomerId: subscription.providerCustomerId,
    });

    await this.invoiceService.recordAttempt({
      invoice,
      succeeded: charge.outcome === 'succeeded',
      providerPaymentId: charge.providerPaymentId,
      failureReason: charge.failureReason,
    });
    if (charge.outcome === 'failed') {
      throw new RpcException(charge.failureReason ?? 'payment_failed');
    }

    await this.invoiceService.markPaid(String(invoice._id));
    const updated = await this.transition(
      subscription,
      SubscriptionStatuses.ACTIVE,
      {
        pastDueSince: null,
        currentPeriodStart: invoice.periodStart,
        currentPeriodEnd: invoice.periodEnd,
      },
    );
    return this.overviewFor(updated, plan);
  }

  /** Apply a provider-verified webhook event to the subscription. */
  async applyWebhookEvent(event: NormalizedWebhookEvent): Promise<void> {
    if (!event.organizationId || event.type === 'unknown') return;
    const organizationId = event.organizationId;
    const { subscription } = await this.getOverview(organizationId);

    switch (event.type) {
      case 'payment_succeeded': {
        const invoice = await this.invoiceService.findLatestOpen(
          organizationId,
        );
        if (!invoice) return;
        await this.invoiceService.recordAttempt({
          invoice,
          succeeded: true,
          providerPaymentId: event.providerPaymentId,
        });
        await this.invoiceService.markPaid(String(invoice._id));
        await this.transition(subscription, SubscriptionStatuses.ACTIVE, {
          pastDueSince: null,
          currentPeriodStart: invoice.periodStart,
          currentPeriodEnd: invoice.periodEnd,
        });
        break;
      }
      case 'payment_failed': {
        if (
          subscription.status === SubscriptionStatuses.ACTIVE ||
          subscription.status === SubscriptionStatuses.TRIALING
        ) {
          await this.transition(subscription, SubscriptionStatuses.PAST_DUE, {
            pastDueSince: new Date(),
          });
        }
        break;
      }
      case 'subscription_cancelled': {
        if (!subscription.cancelAtPeriodEnd) {
          await this.subscriptionRepository.update(
            String(subscription._id),
            { cancelAtPeriodEnd: true, cancelledAt: new Date() },
          );
          this.entitlementService.invalidate(organizationId);
        }
        break;
      }
    }
  }

  /* ------------------------------------------------------------- helpers */

  private async overviewFor(
    subscription: Subscription,
    plan: Plan,
  ): Promise<SubscriptionOverview> {
    const entitlements = await this.entitlementService.build(
      subscription,
      plan,
    );
    return { subscription, plan, entitlements };
  }

  /** Validated status transition (single source of truth for the machine). */
  private async transition(
    subscription: Subscription,
    to: SubscriptionStatus,
    extra: Record<string, unknown> = {},
  ): Promise<Subscription> {
    if (subscription.status === to) {
      return this.subscriptionRepository.update(
        String(subscription._id),
        extra,
      );
    }
    if (!ALLOWED_TRANSITIONS[subscription.status]?.includes(to)) {
      throw new RpcException(
        `invalid_status_transition:${subscription.status}->${to}`,
      );
    }
    const updated = await this.subscriptionRepository.update(
      String(subscription._id),
      { status: to, ...extra },
    );
    this.entitlementService.invalidate(String(subscription.organizationId));
    return updated;
  }

  /** Close the current row and open its replacement atomically enough. */
  private async replaceCurrent(
    existing: Subscription,
    next: Record<string, unknown>,
  ): Promise<Subscription> {
    await this.subscriptionRepository.closeCurrent(
      String(existing.organizationId),
      SubscriptionStatuses.EXPIRED,
    );
    this.entitlementService.invalidate(String(existing.organizationId));
    return this.subscriptionRepository.create({
      ...next,
      isCurrent: true,
    } as any);
  }

  /** Period lapsed (cancel / non-renewal): close row, fall back to free. */
  private async lapseAndFallback(
    subscription: Subscription,
    finalStatus: SubscriptionStatus,
  ): Promise<Subscription> {
    await this.subscriptionRepository.closeCurrent(
      String(subscription.organizationId),
      finalStatus,
    );
    this.entitlementService.invalidate(String(subscription.organizationId));
    return this.provisionDefault(String(subscription.organizationId));
  }

  /**
   * Charge one renewal (or trial conversion) and roll the period forward.
   * A failed charge leaves the subscription past_due with an open invoice
   * that retries/webhooks can settle.
   */
  private async settleRenewal(
    subscription: Subscription,
    periodStart: Date,
  ): Promise<Subscription> {
    const plan = await this.planService.getById(String(subscription.planId));
    const price = this.priceFor(plan, subscription.billingCycle);
    const periodEnd = this.addCycle(periodStart, subscription.billingCycle);

    if (price.amount === 0) {
      return this.transition(subscription, SubscriptionStatuses.ACTIVE, {
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialEndsAt: subscription.trialEndsAt ?? null,
      });
    }

    const provider = this.providerFactory.getProvider();
    const charge = await provider.charge({
      organizationId: String(subscription.organizationId),
      amount: price.amount,
      currency: price.currency,
      description: `${plan.name} renewal (${subscription.billingCycle})`,
      providerCustomerId: subscription.providerCustomerId,
    });

    await this.invoiceService.recordCharge({
      subscription,
      plan,
      amount: price.amount,
      currency: price.currency,
      periodStart,
      periodEnd,
      provider: provider.name,
      succeeded: charge.outcome === 'succeeded',
      providerPaymentId: charge.providerPaymentId,
      failureReason: charge.failureReason,
    });

    if (charge.outcome === 'succeeded') {
      return this.transition(subscription, SubscriptionStatuses.ACTIVE, {
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        pastDueSince: null,
      });
    }
    return this.transition(subscription, SubscriptionStatuses.PAST_DUE, {
      pastDueSince: subscription.pastDueSince ?? new Date(),
    });
  }

  /** Block downgrades that would leave usage above the target plan limits. */
  private async assertUsageFitsPlan(
    organizationId: string,
    target: Plan,
  ): Promise<void> {
    const counters = await this.usageRepository.countersFor(
      organizationId,
      this.monthPeriod(),
    );

    const violations: string[] = [];
    for (const guard of DOWNGRADE_GUARDS) {
      const limit = target.limits?.[guard.limitKey];
      if (limit === undefined || limit < 0) continue;
      if ((counters[guard.counterKey] ?? 0) > limit) {
        violations.push(guard.limitKey);
      }
    }
    const storageLimitGb = target.limits?.[PlanLimitKeys.STORAGE_GB];
    if (
      storageLimitGb !== undefined &&
      storageLimitGb >= 0 &&
      (counters.storageBytes ?? 0) > storageLimitGb * GB
    ) {
      violations.push(PlanLimitKeys.STORAGE_GB);
    }

    if (violations.length > 0) {
      throw new RpcException(
        `downgrade_exceeds_limits:${violations.join(',')}`,
      );
    }
  }

  private priceFor(plan: Plan, cycle: BillingCycle): PlanPrice {
    const price = plan.prices?.[cycle];
    if (!price) throw new RpcException('billing_cycle_not_available');
    return price;
  }

  private addCycle(from: Date, cycle: BillingCycle): Date {
    const end = new Date(from);
    if (cycle === BillingCycles.YEARLY) {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    return end;
  }

  private monthPeriod(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
