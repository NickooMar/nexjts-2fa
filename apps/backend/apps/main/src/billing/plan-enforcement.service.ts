import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PlanLimitKeys } from 'apps/constants';
import { BillingProxy } from 'apps/billing/src/infrastructure/external/billing.proxy';
import {
  PlanLimitExceededException,
  SubscriptionInactiveException,
} from './billing.exceptions';

/**
 * Server-side plan enforcement for the gateway. Each `assert*` runs before
 * the write it guards; the billing service is the authority (frontend
 * validation is cosmetic only).
 *
 * Where a cheap authoritative count exists (properties, members) the caller
 * passes it as `current`, so enforcement of the most visible limits never
 * drifts; metered limits (storage, monthly uploads) use the event-sourced
 * counters, reconciled via SYNC_USAGE.
 *
 * If the billing service is unreachable, checks pass when
 * BILLING_ENFORCEMENT_FAIL_OPEN=true (availability over enforcement, same
 * trade-off as RATE_LIMIT_FAIL_OPEN) and fail with 503 otherwise.
 */
@Injectable()
export class PlanEnforcementService {
  private readonly logger = new Logger(PlanEnforcementService.name);

  constructor(
    private readonly billingProxy: BillingProxy,
    private readonly configService: ConfigService,
  ) {}

  /** `current` = authoritative property count from the user service. */
  async assertCanCreateProperty(
    organizationId: string,
    current: number,
  ): Promise<void> {
    await this.check({
      organizationId,
      limitKey: PlanLimitKeys.PROPERTIES,
      delta: 1,
      current,
    });
  }

  /** `current` = active member count of the target organization. */
  async assertCanAddMember(
    organizationId: string,
    current: number,
  ): Promise<void> {
    await this.check({
      organizationId,
      limitKey: PlanLimitKeys.MEMBERS,
      delta: 1,
      current,
    });
  }

  /** Guards both total storage (bytes) and the monthly upload meter. */
  async assertCanUploadFiles(
    organizationId: string,
    fileCount: number,
    totalBytes: number,
  ): Promise<void> {
    await this.check({
      organizationId,
      limitKey: PlanLimitKeys.STORAGE_GB,
      delta: totalBytes,
    });
    await this.check({
      organizationId,
      limitKey: PlanLimitKeys.FILE_UPLOADS_PER_MONTH,
      delta: fileCount,
    });
  }

  private async check(input: {
    organizationId: string;
    limitKey: string;
    delta: number;
    current?: number;
  }): Promise<void> {
    let result: {
      allowed: boolean;
      reason?: string;
      limit?: number;
      current?: number;
      code?: string;
      currentPlan?: string;
      currentPlanName?: string;
      upgradeAvailable?: boolean;
    };

    try {
      result = await firstValueFrom(this.billingProxy.checkLimit(input));
    } catch (error) {
      const failOpen = this.configService.get<boolean>(
        'BILLING_ENFORCEMENT_FAIL_OPEN',
        true,
      );
      this.logger.warn(
        `Limit check ${input.limitKey} unavailable (${error}); ` +
          (failOpen ? 'failing open' : 'failing closed'),
      );
      if (failOpen) return;
      throw new ServiceUnavailableException('billing_unavailable');
    }

    if (result.allowed) return;
    if (result.reason === 'subscription_inactive') {
      throw new SubscriptionInactiveException();
    }
    throw new PlanLimitExceededException({
      code: result.code,
      limitKey: input.limitKey,
      limit: result.limit,
      current: result.current,
      currentPlan: result.currentPlan,
      currentPlanName: result.currentPlanName,
      upgradeAvailable: result.upgradeAvailable,
    });
  }
}
