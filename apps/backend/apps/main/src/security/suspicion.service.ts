import { createHash } from 'crypto';
import type Redis from 'ioredis';
import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { SECURITY_REDIS } from './redis.module';
import { SecurityMetricsService } from './security-metrics.service';
import { botDetectionConfig } from './security.config';
import { getClientIp } from './client-ip.util';

export interface SecurityContext {
  ip: string;
  fingerprint: string;
  /** Static heuristics that fired for this request (empty = looks normal). */
  signals: string[];
}

declare module 'express-serve-static-core' {
  interface Request {
    securityContext?: SecurityContext;
  }
}

/**
 * Lightweight bot mitigation: every request gets a stable fingerprint
 * (IP + client headers). Cheap header heuristics plus rate-limit violations
 * feed a suspicion score in Redis; clients that cross the threshold are
 * flagged, which the CaptchaGuard (when enabled) uses to demand a challenge
 * on high-risk endpoints.
 */
@Injectable()
export class SuspicionService {
  constructor(
    @Inject(SECURITY_REDIS) private readonly redis: Redis | null,
    private readonly metrics: SecurityMetricsService,
  ) {}

  buildContext(req: Request): SecurityContext {
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] ?? '';
    const fingerprint = createHash('sha256')
      .update(
        [
          ip,
          ua,
          req.headers['accept-language'] ?? '',
          req.headers['accept-encoding'] ?? '',
        ].join('|'),
      )
      .digest('hex')
      .slice(0, 16);

    const config = botDetectionConfig();
    const signals: string[] = [];
    if (config.enabled) {
      if (!ua) signals.push('missing_user_agent');
      else if (new RegExp(config.uaPatterns, 'i').test(ua)) {
        signals.push('scripted_user_agent');
      }
      if (!req.headers['accept']) signals.push('missing_accept_header');
    }

    return { ip, fingerprint, signals };
  }

  /** Accumulate suspicion; weight lets 429s count more than header oddities. */
  penalize(ctx: SecurityContext, weight = 1): void {
    const config = botDetectionConfig();
    if (!config.enabled || !this.redis) return;

    const scoreKey = `suspicion:score:${ctx.fingerprint}`;
    this.redis
      .multi()
      .incrby(scoreKey, weight)
      .expire(scoreKey, config.windowSeconds)
      .exec()
      .then(async (results) => {
        const score = Number(results?.[0]?.[1] ?? 0);
        if (score < config.flagThreshold) return;
        const created = await this.redis!.set(
          `suspicion:flag:${ctx.fingerprint}`,
          '1',
          'EX',
          config.flagTtlSeconds,
          'NX',
        );
        if (created) {
          this.metrics.record('suspicious_client_flagged', {
            fingerprint: ctx.fingerprint,
            ip: ctx.ip,
            score,
          });
        }
      })
      .catch(() => undefined);
  }

  async isFlagged(fingerprint: string): Promise<boolean> {
    if (!this.redis) return false;
    try {
      return (await this.redis.exists(`suspicion:flag:${fingerprint}`)) === 1;
    } catch {
      return false;
    }
  }
}
