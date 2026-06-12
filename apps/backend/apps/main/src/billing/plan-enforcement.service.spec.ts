import { of, throwError } from 'rxjs';
import { ServiceUnavailableException } from '@nestjs/common';
import { PlanEnforcementService } from './plan-enforcement.service';
import {
  PlanLimitExceededException,
  SubscriptionInactiveException,
} from './billing.exceptions';

describe('PlanEnforcementService (gateway)', () => {
  let billingProxy: { checkLimit: jest.Mock };
  let failOpen: boolean;
  let service: PlanEnforcementService;

  beforeEach(() => {
    failOpen = true;
    billingProxy = { checkLimit: jest.fn() };
    const configService = {
      get: jest.fn((key: string, fallback: any) =>
        key === 'BILLING_ENFORCEMENT_FAIL_OPEN' ? failOpen : fallback,
      ),
    };
    service = new PlanEnforcementService(
      billingProxy as any,
      configService as any,
    );
  });

  it('passes when the billing service allows the operation', async () => {
    billingProxy.checkLimit.mockReturnValue(of({ allowed: true }));
    await expect(
      service.assertCanCreateProperty('org', 1),
    ).resolves.toBeUndefined();
    expect(billingProxy.checkLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org',
        limitKey: 'properties',
        delta: 1,
        current: 1,
      }),
    );
  });

  it('throws 402 with limit context when the plan limit is reached', async () => {
    billingProxy.checkLimit.mockReturnValue(
      of({ allowed: false, reason: 'limit_reached', limit: 3, current: 3 }),
    );
    await expect(service.assertCanCreateProperty('org', 3)).rejects.toThrow(
      PlanLimitExceededException,
    );
  });

  it('throws 402 when the subscription is suspended/expired', async () => {
    billingProxy.checkLimit.mockReturnValue(
      of({ allowed: false, reason: 'subscription_inactive' }),
    );
    await expect(service.assertCanAddMember('org', 1)).rejects.toThrow(
      SubscriptionInactiveException,
    );
  });

  it('checks both storage and the monthly upload meter for uploads', async () => {
    billingProxy.checkLimit.mockReturnValue(of({ allowed: true }));
    await service.assertCanUploadFiles('org', 2, 1024);
    const limitKeys = billingProxy.checkLimit.mock.calls.map(
      ([input]) => input.limitKey,
    );
    expect(limitKeys).toEqual(['storageGb', 'fileUploadsPerMonth']);
  });

  it('fails open when billing is unreachable and the flag allows it', async () => {
    billingProxy.checkLimit.mockReturnValue(
      throwError(() => new Error('connection refused')),
    );
    await expect(
      service.assertCanCreateProperty('org', 0),
    ).resolves.toBeUndefined();
  });

  it('fails closed (503) when configured to', async () => {
    failOpen = false;
    billingProxy.checkLimit.mockReturnValue(
      throwError(() => new Error('connection refused')),
    );
    await expect(service.assertCanCreateProperty('org', 0)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
