import { BillingEventPatterns, PlanLimitKeys } from 'apps/constants';
import { UsageService } from './usage.service';
import { LIFETIME_PERIOD } from '../entities/subscription-usage.entity';

const GB = 1024 * 1024 * 1024;

describe('UsageService', () => {
  let service: UsageService;
  let usageRepository: {
    increment: jest.Mock;
    setCounters: jest.Mock;
    find: jest.Mock;
    countersFor: jest.Mock;
  };
  let processedEvents: { claim: jest.Mock };
  let subscriptionService: { getEntitlements: jest.Mock; getOverview: jest.Mock };

  const entitlements = (overrides: Partial<any> = {}) => ({
    isOperational: true,
    planSlug: 'free',
    planName: 'Free',
    limits: {
      [PlanLimitKeys.PROPERTIES]: 3,
      [PlanLimitKeys.STORAGE_GB]: 1,
      [PlanLimitKeys.MEMBERS]: -1,
    },
    features: {},
    ...overrides,
  });

  beforeEach(() => {
    usageRepository = {
      increment: jest.fn().mockResolvedValue(undefined),
      setCounters: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue(null),
      countersFor: jest.fn().mockResolvedValue({}),
    };
    processedEvents = { claim: jest.fn().mockResolvedValue(true) };
    subscriptionService = {
      getEntitlements: jest.fn().mockResolvedValue(entitlements()),
      getOverview: jest.fn().mockResolvedValue({}),
    };
    service = new UsageService(
      usageRepository as any,
      processedEvents as any,
      subscriptionService as any,
    );
  });

  describe('checkLimit (plan enforcement)', () => {
    it('rejects everything when the subscription is not operational', async () => {
      subscriptionService.getEntitlements.mockResolvedValue(
        entitlements({ isOperational: false }),
      );
      const result = await service.checkLimit({
        organizationId: 'org',
        limitKey: PlanLimitKeys.PROPERTIES,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('subscription_inactive');
      expect(result.code).toBe('SUBSCRIPTION_INACTIVE');
    });

    it('allows when the plan defines no such limit', async () => {
      const result = await service.checkLimit({
        organizationId: 'org',
        limitKey: 'someFutureLimit',
      });
      expect(result.allowed).toBe(true);
    });

    it('treats -1 as unlimited', async () => {
      const result = await service.checkLimit({
        organizationId: 'org',
        limitKey: PlanLimitKeys.MEMBERS,
        current: 5000,
      });
      expect(result.allowed).toBe(true);
    });

    it('allows under the limit and rejects at the limit', async () => {
      expect(
        (
          await service.checkLimit({
            organizationId: 'org',
            limitKey: PlanLimitKeys.PROPERTIES,
            delta: 1,
            current: 2,
          })
        ).allowed,
      ).toBe(true);

      const rejected = await service.checkLimit({
        organizationId: 'org',
        limitKey: PlanLimitKeys.PROPERTIES,
        delta: 1,
        current: 3,
      });
      expect(rejected.allowed).toBe(false);
      expect(rejected.reason).toBe('limit_reached');
      expect(rejected.code).toBe('PROPERTY_LIMIT_EXCEEDED');
      expect(rejected.currentPlan).toBe('free');
      expect(rejected.currentPlanName).toBe('Free');
    });

    it('prefers the authoritative current over the stored counter', async () => {
      usageRepository.countersFor.mockResolvedValue({ properties: 0 });
      const result = await service.checkLimit({
        organizationId: 'org',
        limitKey: PlanLimitKeys.PROPERTIES,
        delta: 1,
        current: 3,
      });
      expect(result.allowed).toBe(false);
    });

    it('converts storage limits from GB to bytes', async () => {
      usageRepository.countersFor.mockResolvedValue({
        storageBytes: 0.5 * GB,
      });
      const allowed = await service.checkLimit({
        organizationId: 'org',
        limitKey: PlanLimitKeys.STORAGE_GB,
        delta: 0.4 * GB,
      });
      expect(allowed.allowed).toBe(true);

      const rejected = await service.checkLimit({
        organizationId: 'org',
        limitKey: PlanLimitKeys.STORAGE_GB,
        delta: 0.6 * GB,
      });
      expect(rejected.allowed).toBe(false);
      expect(rejected.limit).toBe(1 * GB);
    });
  });

  describe('recordEvent (usage tracking)', () => {
    it('skips duplicate deliveries (idempotency)', async () => {
      processedEvents.claim.mockResolvedValue(false);
      await service.recordEvent(BillingEventPatterns.PROPERTY_CREATED, {
        eventId: 'evt-1',
        organizationId: 'org',
      });
      expect(usageRepository.increment).not.toHaveBeenCalled();
    });

    it('tracks property creation as a lifetime gauge', async () => {
      await service.recordEvent(BillingEventPatterns.PROPERTY_CREATED, {
        eventId: 'evt-2',
        organizationId: 'org',
      });
      expect(usageRepository.increment).toHaveBeenCalledWith(
        'org',
        LIFETIME_PERIOD,
        'properties',
        1,
      );
    });

    it('tracks uploads as storage bytes plus a monthly meter', async () => {
      await service.recordEvent(BillingEventPatterns.FILE_UPLOADED, {
        eventId: 'evt-3',
        organizationId: 'org',
        quantity: 3,
        bytes: 1234,
      });
      expect(usageRepository.increment).toHaveBeenCalledWith(
        'org',
        LIFETIME_PERIOD,
        'storageBytes',
        1234,
      );
      const monthly = usageRepository.increment.mock.calls.find(
        ([, , counter]) => counter === 'fileUploads',
      );
      expect(monthly).toBeDefined();
      expect(monthly[1]).toMatch(/^\d{4}-\d{2}$/);
      expect(monthly[3]).toBe(3);
    });

    it('decrements storage on file deletion', async () => {
      await service.recordEvent(BillingEventPatterns.FILE_DELETED, {
        eventId: 'evt-4',
        organizationId: 'org',
        bytes: 500,
      });
      expect(usageRepository.increment).toHaveBeenCalledWith(
        'org',
        LIFETIME_PERIOD,
        'storageBytes',
        -500,
      );
    });

    it('bootstraps billing when an organization is created', async () => {
      await service.recordEvent(BillingEventPatterns.ORGANIZATION_CREATED, {
        eventId: 'evt-5',
        organizationId: 'org',
      });
      expect(subscriptionService.getOverview).toHaveBeenCalledWith('org');
      expect(usageRepository.setCounters).toHaveBeenCalledWith(
        'org',
        LIFETIME_PERIOD,
        { members: 1 },
      );
    });
  });

  describe('syncUsage (reconciliation)', () => {
    it('accepts only known gauges and clamps negatives', async () => {
      await service.syncUsage('org', {
        properties: 7,
        members: -2,
        apiRequests: 999, // monthly meter — not a gauge, must be ignored
      });
      expect(usageRepository.setCounters).toHaveBeenCalledWith(
        'org',
        LIFETIME_PERIOD,
        { properties: 7, members: 0 },
      );
    });
  });
});
