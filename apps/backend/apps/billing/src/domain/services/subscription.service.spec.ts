import { RpcException } from '@nestjs/microservices';
import { SubscriptionStatuses } from 'apps/constants';
import { SubscriptionService } from './subscription.service';

const DAY = 24 * 60 * 60 * 1000;

describe('SubscriptionService (lifecycle)', () => {
  let service: SubscriptionService;
  let store: Record<string, any>;
  let subscriptionRepository: any;
  let planService: any;
  let invoiceService: any;
  let entitlementService: any;
  let provider: any;
  let usageRepository: any;

  const freePlan = {
    _id: 'plan-free',
    slug: 'free',
    name: 'Free',
    trialDays: 0,
    prices: { monthly: { amount: 0, currency: 'USD' } },
    limits: { properties: 3, members: 2, storageGb: 1 },
    features: {},
  };
  const proPlan = {
    _id: 'plan-pro',
    slug: 'pro',
    name: 'Pro',
    trialDays: 14,
    prices: {
      monthly: { amount: 7900, currency: 'USD' },
      yearly: { amount: 79000, currency: 'USD' },
    },
    limits: { properties: 200, members: 20, storageGb: 100 },
    features: {},
  };

  const makeSubscription = (overrides: Partial<any> = {}) => ({
    _id: 'sub-1',
    organizationId: 'org-1',
    planId: proPlan._id,
    status: SubscriptionStatuses.ACTIVE,
    billingCycle: 'monthly',
    isCurrent: true,
    currentPeriodStart: new Date(Date.now() - 15 * DAY),
    currentPeriodEnd: new Date(Date.now() + 15 * DAY),
    cancelAtPeriodEnd: false,
    provider: 'mock',
    ...overrides,
  });

  beforeEach(() => {
    store = { subscription: null, history: [] };

    subscriptionRepository = {
      findCurrentByOrganization: jest.fn(async () => store.subscription),
      findById: jest.fn(async () => store.subscription),
      findHistory: jest.fn(async () => store.history),
      findDueForLifecycle: jest.fn(async () => []),
      create: jest.fn(async (input: any) => {
        store.subscription = { _id: `sub-${Date.now()}`, ...input };
        return store.subscription;
      }),
      update: jest.fn(async (_id: string, changes: any) => {
        store.subscription = { ...store.subscription, ...changes };
        return store.subscription;
      }),
      closeCurrent: jest.fn(async (_orgId: string, finalStatus: string) => {
        if (store.subscription) {
          store.history.push({
            ...store.subscription,
            isCurrent: false,
            status: finalStatus,
          });
        }
        store.subscription = null;
      }),
    };

    planService = {
      getBySlug: jest.fn(async (slug: string) =>
        slug === 'pro' ? proPlan : freePlan,
      ),
      getById: jest.fn(async (id: string) =>
        id === proPlan._id ? proPlan : freePlan,
      ),
    };

    invoiceService = {
      recordCharge: jest.fn(async () => ({ invoice: {}, payment: {} })),
      recordAttempt: jest.fn(async () => ({})),
      markPaid: jest.fn(async () => ({})),
      findLatestOpen: jest.fn(async () => null),
    };

    entitlementService = {
      build: jest.fn(async (subscription: any, plan: any) => ({
        organizationId: String(subscription.organizationId),
        planSlug: plan.slug,
        status: subscription.status,
        limits: plan.limits,
        features: plan.features,
        isOperational: true,
      })),
      getCached: jest.fn(() => null),
      invalidate: jest.fn(),
    };

    provider = {
      name: 'mock',
      createCheckout: jest.fn(async () => ({
        outcome: 'succeeded',
        providerPaymentId: 'pay-1',
      })),
      charge: jest.fn(async () => ({
        outcome: 'succeeded',
        providerPaymentId: 'pay-2',
      })),
      cancelRemote: jest.fn(async () => undefined),
    };

    usageRepository = { countersFor: jest.fn(async () => ({})) };

    const configService = {
      get: jest.fn((_key: string, fallback?: any) => fallback),
    };

    service = new SubscriptionService(
      planService,
      invoiceService,
      entitlementService,
      { getProvider: () => provider } as any,
      subscriptionRepository,
      usageRepository,
      configService as any,
    );
  });

  it('auto-provisions the default plan for organizations without billing', async () => {
    const { subscription, plan } = await service.getOverview('org-1');
    expect(plan.slug).toBe('free');
    expect(subscription.status).toBe(SubscriptionStatuses.ACTIVE);
    expect(subscriptionRepository.create).toHaveBeenCalled();
  });

  it('converts an expired trial into a paid subscription (charge succeeds)', async () => {
    store.subscription = makeSubscription({
      status: SubscriptionStatuses.TRIALING,
      trialEndsAt: new Date(Date.now() - DAY),
      currentPeriodEnd: new Date(Date.now() - DAY),
    });

    const { subscription } = await service.getOverview('org-1');

    expect(provider.charge).toHaveBeenCalled();
    expect(invoiceService.recordCharge).toHaveBeenCalledWith(
      expect.objectContaining({ succeeded: true }),
    );
    expect(subscription.status).toBe(SubscriptionStatuses.ACTIVE);
    expect(new Date(subscription.currentPeriodEnd).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it('moves to past_due when the renewal charge fails', async () => {
    provider.charge.mockResolvedValue({
      outcome: 'failed',
      failureReason: 'card_declined',
    });
    store.subscription = makeSubscription({
      currentPeriodEnd: new Date(Date.now() - DAY),
    });

    const { subscription } = await service.getOverview('org-1');

    expect(subscription.status).toBe(SubscriptionStatuses.PAST_DUE);
    expect(subscription.pastDueSince).toBeDefined();
    expect(invoiceService.recordCharge).toHaveBeenCalledWith(
      expect.objectContaining({ succeeded: false }),
    );
  });

  it('suspends a past_due subscription after the grace window', async () => {
    store.subscription = makeSubscription({
      status: SubscriptionStatuses.PAST_DUE,
      pastDueSince: new Date(Date.now() - 10 * DAY), // grace default is 7
    });

    const { subscription } = await service.getOverview('org-1');
    expect(subscription.status).toBe(SubscriptionStatuses.SUSPENDED);
  });

  it('lapses a cancelled subscription at period end and falls back to free', async () => {
    store.subscription = makeSubscription({
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(Date.now() - DAY),
    });

    const { plan, subscription } = await service.getOverview('org-1');

    expect(
      store.history.some(
        (row: any) => row.status === SubscriptionStatuses.CANCELLED,
      ),
    ).toBe(true);
    expect(plan.slug).toBe('free');
    expect(subscription.status).toBe(SubscriptionStatuses.ACTIVE);
  });

  it('grants one trial per organization on first paid checkout', async () => {
    store.subscription = makeSubscription({
      planId: freePlan._id,
      status: SubscriptionStatuses.ACTIVE,
    });

    const result = await service.checkout({
      organizationId: 'org-1',
      planSlug: 'pro',
      billingCycle: 'monthly',
    });

    expect(result.subscription.status).toBe(SubscriptionStatuses.TRIALING);
    expect(result.subscription.trialEndsAt).toBeDefined();
    expect(provider.createCheckout).not.toHaveBeenCalled();
  });

  it('charges immediately when the organization already used its trial', async () => {
    store.subscription = makeSubscription({ planId: freePlan._id });
    store.history = [{ trialEndsAt: new Date() }];

    const result = await service.checkout({
      organizationId: 'org-1',
      planSlug: 'pro',
      billingCycle: 'monthly',
    });

    expect(provider.createCheckout).toHaveBeenCalled();
    expect(result.subscription.status).toBe(SubscriptionStatuses.ACTIVE);
    expect(invoiceService.recordCharge).toHaveBeenCalled();
  });

  it('blocks downgrades while usage exceeds the target plan limits', async () => {
    store.subscription = makeSubscription();
    usageRepository.countersFor.mockResolvedValue({ properties: 10 });

    await expect(
      service.changePlan({
        organizationId: 'org-1',
        planSlug: 'free',
        billingCycle: 'monthly',
      }),
    ).rejects.toThrow(RpcException);
    expect(provider.charge).not.toHaveBeenCalled();
  });

  it('cancels at period end and resumes before it lapses', async () => {
    store.subscription = makeSubscription();

    const cancelled = await service.cancel('org-1');
    expect(cancelled.subscription.cancelAtPeriodEnd).toBe(true);
    expect(provider.cancelRemote).toHaveBeenCalled();

    const resumed = await service.resume('org-1');
    expect(resumed.subscription.cancelAtPeriodEnd).toBe(false);
  });

  it('reactivates via retryPayment once the open invoice settles', async () => {
    const periodStart = new Date(Date.now() - DAY);
    const periodEnd = new Date(Date.now() + 29 * DAY);
    store.subscription = makeSubscription({
      status: SubscriptionStatuses.PAST_DUE,
      pastDueSince: new Date(),
    });
    invoiceService.findLatestOpen.mockResolvedValue({
      _id: 'inv-1',
      total: 7900,
      currency: 'USD',
      number: 'INV-2026-000001',
      periodStart,
      periodEnd,
      organizationId: 'org-1',
      subscriptionId: 'sub-1',
      provider: 'mock',
    });

    const result = await service.retryPayment('org-1');

    expect(invoiceService.markPaid).toHaveBeenCalledWith('inv-1');
    expect(result.subscription.status).toBe(SubscriptionStatuses.ACTIVE);
    expect(result.subscription.pastDueSince).toBeNull();
  });
});
