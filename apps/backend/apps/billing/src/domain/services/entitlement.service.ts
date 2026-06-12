import { Injectable } from '@nestjs/common';
import {
  BillingCycle,
  SubscriptionStatus,
  ACTIVE_SUBSCRIPTION_STATUSES,
} from 'apps/constants';
import { Plan } from '../entities/plan.entity';
import { Subscription } from '../entities/subscription.entity';
import { FeatureFlagRepository } from '../../infrastructure/repository/feature-flag.repository';

/**
 * What an organization is entitled to *right now*: the plan's limits and
 * feature toggles, overridden by per-organization FeatureFlags, plus the
 * subscription state the caller needs to gate writes. This is the single
 * payload backend guards and the frontend UI consume.
 */
export interface Entitlements {
  organizationId: string;
  planId: string;
  planSlug: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  /** False once the subscription is suspended/expired — all writes blocked. */
  isOperational: boolean;
  limits: Record<string, number>;
  features: Record<string, boolean>;
  currentPeriodEnd: Date;
  trialEndsAt?: Date | null;
  cancelAtPeriodEnd: boolean;
}

interface CacheEntry {
  value: Entitlements;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000;

@Injectable()
export class EntitlementService {
  /**
   * Entitlements are read on every enforced write, so they are cached
   * in-memory per organization. The TTL is short and mutations call
   * `invalidate`, so staleness is bounded to seconds on other replicas.
   */
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly featureFlagRepository: FeatureFlagRepository) {}

  getCached(organizationId: string): Entitlements | null {
    const entry = this.cache.get(organizationId);
    if (!entry || entry.expiresAt < Date.now()) return null;
    return entry.value;
  }

  invalidate(organizationId: string): void {
    this.cache.delete(organizationId);
  }

  async build(
    subscription: Subscription,
    plan: Plan,
  ): Promise<Entitlements> {
    const organizationId = String(subscription.organizationId);
    const overrides =
      await this.featureFlagRepository.findActiveByOrganization(
        organizationId,
      );

    const features = { ...plan.features };
    for (const flag of overrides) {
      features[flag.key] = flag.enabled;
    }

    const entitlements: Entitlements = {
      organizationId,
      planId: String(plan._id),
      planSlug: plan.slug,
      planName: plan.name,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      isOperational: ACTIVE_SUBSCRIPTION_STATUSES.includes(
        subscription.status,
      ),
      limits: { ...plan.limits },
      features,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };

    this.cache.set(organizationId, {
      value: entitlements,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return entitlements;
  }
}
