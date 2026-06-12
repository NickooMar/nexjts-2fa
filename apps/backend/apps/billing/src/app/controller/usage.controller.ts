import { Observable, from } from 'rxjs';
import { Controller } from '@nestjs/common';
import { BillingPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import {
  UsageService,
  LimitCheckInput,
  LimitCheckResult,
} from '../../domain/services/usage.service';

@Controller()
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @MessagePattern({ cmd: BillingPatterns.GET_USAGE })
  getUsage(payload: { organizationId: string }): Observable<any> {
    return from(this.usageService.getUsage(payload.organizationId));
  }

  /** Server-side plan enforcement — called by the gateway before writes. */
  @MessagePattern({ cmd: BillingPatterns.CHECK_LIMIT })
  checkLimit(payload: LimitCheckInput): Observable<LimitCheckResult> {
    return from(this.usageService.checkLimit(payload));
  }

  /** Authoritative gauge reconciliation pushed by the gateway. */
  @MessagePattern({ cmd: BillingPatterns.SYNC_USAGE })
  syncUsage(payload: {
    organizationId: string;
    gauges: Record<string, number>;
  }): Observable<{ success: boolean }> {
    return from(
      this.usageService
        .syncUsage(payload.organizationId, payload.gauges)
        .then(() => ({ success: true })),
    );
  }
}
