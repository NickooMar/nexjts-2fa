import type Redis from 'ioredis';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SECURITY_REDIS } from './redis.module';

export type SecurityEvent =
  | 'rate_limit_exceeded'
  | 'account_locked'
  | 'ip_locked'
  | 'login_failure'
  | 'verification_brute_force'
  | 'invitation_brute_force'
  | 'suspicious_client_flagged'
  | 'captcha_required'
  | 'captcha_failed';

const COUNTER_TTL_SECONDS = 7 * 24 * 3600;

/**
 * One funnel for every security signal: structured JSON log lines (for
 * CloudWatch metric filters / alerting) plus daily counters in Redis so
 * violations can be inspected across all replicas.
 */
@Injectable()
export class SecurityMetricsService {
  private readonly logger = new Logger('Security');

  constructor(@Inject(SECURITY_REDIS) private readonly redis: Redis | null) {}

  record(event: SecurityEvent, detail: Record<string, unknown> = {}): void {
    this.logger.warn(
      JSON.stringify({ event, ...detail, at: new Date().toISOString() }),
    );

    if (!this.redis) return;
    const day = new Date().toISOString().slice(0, 10);
    const key = `metrics:security:${event}:${day}`;
    // Fire-and-forget: metrics must never add latency or failures.
    this.redis
      .multi()
      .incr(key)
      .expire(key, COUNTER_TTL_SECONDS)
      .exec()
      .catch(() => undefined);
  }

  /** Today's violation counters (ops/debugging helper). */
  async snapshot(): Promise<Record<string, number>> {
    if (!this.redis) return {};
    const day = new Date().toISOString().slice(0, 10);
    const keys = await this.redis.keys(`metrics:security:*:${day}`);
    if (keys.length === 0) return {};
    const values = await this.redis.mget(...keys);
    return Object.fromEntries(
      keys.map((key, i) => [
        key.replace('metrics:security:', '').replace(`:${day}`, ''),
        parseInt(values[i] ?? '0', 10),
      ]),
    );
  }
}
