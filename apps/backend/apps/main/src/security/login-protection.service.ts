import { createHash } from 'crypto';
import type Redis from 'ioredis';
import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SECURITY_REDIS } from './redis.module';
import { SecurityMetricsService } from './security-metrics.service';
import { AttemptScope, attemptPolicy } from './security.config';

interface LockState {
  locked: boolean;
  retryAfterSeconds: number;
}

/** In-memory stand-in used when Redis is not configured (dev, tests). */
class MemoryAttemptStore {
  private readonly entries = new Map<
    string,
    { value: number; expiresAt: number }
  >();

  private alive(key: string) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry;
  }

  incr(key: string, ttlMs: number): number {
    const entry = this.alive(key);
    if (!entry) {
      this.entries.set(key, { value: 1, expiresAt: Date.now() + ttlMs });
      return 1;
    }
    entry.value += 1;
    return entry.value;
  }

  set(key: string, value: number, ttlMs: number): void {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  pttl(key: string): number {
    const entry = this.alive(key);
    return entry ? entry.expiresAt - Date.now() : -2;
  }

  del(...keys: string[]): void {
    keys.forEach((key) => this.entries.delete(key));
  }
}

/**
 * Brute-force protection shared by signin, email-verification codes and
 * invitation redemption: counts failures per identifier inside a rolling
 * window, then applies a temporary lockout whose duration doubles on every
 * repeated lockout (progressive backoff), capped by policy.
 *
 * Identifiers are hashed so emails/tokens never appear as raw Redis keys
 * or in log lines.
 */
@Injectable()
export class LoginProtectionService {
  private readonly memory = new MemoryAttemptStore();
  /** How long repeat-offender history (the backoff exponent) is remembered. */
  private static readonly STRIKES_TTL_MS = 7 * 24 * 3600 * 1000;

  constructor(
    @Inject(SECURITY_REDIS) private readonly redis: Redis | null,
    private readonly metrics: SecurityMetricsService,
  ) {}

  /** Throws 429 (with Retry-After info in the body) when locked. */
  async assertNotLocked(scope: AttemptScope, id: string): Promise<void> {
    const { locked, retryAfterSeconds } = await this.getLockState(scope, id);
    if (!locked) return;
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        code: 'temporarily_locked',
        message: `Too many failed attempts. Try again in ${retryAfterSeconds}s.`,
        retryAfterSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  async getLockState(scope: AttemptScope, id: string): Promise<LockState> {
    const pttl = await this.pttl(this.key(scope, id, 'lock'));
    return pttl > 0
      ? { locked: true, retryAfterSeconds: Math.ceil(pttl / 1000) }
      : { locked: false, retryAfterSeconds: 0 };
  }

  /**
   * Count one failure; once the window's budget is exhausted, install a lock
   * of base * 2^(previousLockouts) seconds and reset the failure counter.
   */
  async recordFailure(scope: AttemptScope, id: string): Promise<LockState> {
    const policy = attemptPolicy(scope);
    const fails = await this.incr(
      this.key(scope, id, 'fails'),
      policy.windowSeconds * 1000,
    );
    this.metrics.record('login_failure', { scope, id: this.fingerprint(id) });

    if (fails < policy.maxAttempts) {
      return { locked: false, retryAfterSeconds: 0 };
    }

    const strikes = await this.incr(
      this.key(scope, id, 'strikes'),
      LoginProtectionService.STRIKES_TTL_MS,
    );
    const lockSeconds = Math.min(
      policy.baseLockSeconds * 2 ** (strikes - 1),
      policy.maxLockSeconds,
    );
    await this.set(this.key(scope, id, 'lock'), 1, lockSeconds * 1000);
    await this.del(this.key(scope, id, 'fails'));

    this.metrics.record(scope === 'login-ip' ? 'ip_locked' : 'account_locked', {
      scope,
      id: this.fingerprint(id),
      lockSeconds,
      strikes,
    });
    return { locked: true, retryAfterSeconds: lockSeconds };
  }

  /** A legitimate success clears the failure window (but not strike history). */
  async recordSuccess(scope: AttemptScope, id: string): Promise<void> {
    await this.del(this.key(scope, id, 'fails'));
  }

  private key(scope: AttemptScope, id: string, kind: string): string {
    return `lockout:${scope}:${this.fingerprint(id)}:${kind}`;
  }

  private fingerprint(id: string): string {
    return createHash('sha256')
      .update(id.toLowerCase().trim())
      .digest('hex')
      .slice(0, 24);
  }

  private async incr(key: string, ttlMs: number): Promise<number> {
    if (!this.redis) return this.memory.incr(key, ttlMs);
    try {
      const count = await this.redis.incr(key);
      if (count === 1) await this.redis.pexpire(key, ttlMs);
      return count;
    } catch {
      return this.memory.incr(key, ttlMs);
    }
  }

  private async set(key: string, value: number, ttlMs: number): Promise<void> {
    if (!this.redis) return this.memory.set(key, value, ttlMs);
    try {
      await this.redis.set(key, value, 'PX', ttlMs);
    } catch {
      this.memory.set(key, value, ttlMs);
    }
  }

  private async pttl(key: string): Promise<number> {
    if (!this.redis) return this.memory.pttl(key);
    try {
      return await this.redis.pttl(key);
    } catch {
      return this.memory.pttl(key);
    }
  }

  private async del(...keys: string[]): Promise<void> {
    if (!this.redis) return this.memory.del(...keys);
    try {
      await this.redis.del(...keys);
    } catch {
      this.memory.del(...keys);
    }
  }
}
