import {
  Injectable,
  CallHandler,
  NestInterceptor,
  OnModuleDestroy,
  ExecutionContext,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { BillingEventPatterns } from 'apps/constants';
import { BillingProxy } from 'apps/billing/src/infrastructure/external/billing.proxy';

const FLUSH_INTERVAL_MS = 10_000;

/**
 * Meters API requests per organization for the apiRequestsPerMonth usage
 * metric. Counts are buffered in memory and flushed as one batched
 * fire-and-forget event every few seconds, so metering adds zero latency
 * and zero failure modes to request handling.
 */
@Injectable()
export class ApiUsageInterceptor implements NestInterceptor, OnModuleDestroy {
  private readonly pending = new Map<string, number>();
  private readonly timer: NodeJS.Timeout;

  constructor(private readonly billingProxy: BillingProxy) {
    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
    this.timer.unref?.();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest?.();
    const organizationId = request?.user?.tenantId;
    if (organizationId) {
      const key = String(organizationId);
      this.pending.set(key, (this.pending.get(key) ?? 0) + 1);
    }
    return next.handle();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
    this.flush();
  }

  private flush(): void {
    for (const [organizationId, quantity] of this.pending) {
      this.billingProxy.emitUsageEvent(BillingEventPatterns.API_USAGE, {
        organizationId,
        quantity,
      });
    }
    this.pending.clear();
  }
}
