import RedisMock from 'ioredis-mock';
import type Redis from 'ioredis';
import { HttpException } from '@nestjs/common';
import { LoginProtectionService } from './login-protection.service';
import { SecurityMetricsService } from './security-metrics.service';

describe('LoginProtectionService', () => {
  let redis: Redis;
  let service: LoginProtectionService;
  let metrics: jest.Mocked<SecurityMetricsService>;

  const failTimes = async (n: number, id = 'user@example.com') => {
    let last;
    for (let i = 0; i < n; i++) {
      last = await service.recordFailure('login-account', id);
    }
    return last!;
  };

  beforeEach(() => {
    redis = new RedisMock() as unknown as Redis;
    metrics = {
      record: jest.fn(),
    } as unknown as jest.Mocked<SecurityMetricsService>;
    service = new LoginProtectionService(redis, metrics);
  });

  afterEach(async () => {
    await (redis as any).flushall();
    jest.restoreAllMocks();
  });

  it('does not lock below the attempt threshold', async () => {
    const state = await failTimes(4); // default threshold: 5
    expect(state.locked).toBe(false);
    await expect(
      service.assertNotLocked('login-account', 'user@example.com'),
    ).resolves.toBeUndefined();
  });

  it('locks after exhausting the failure budget', async () => {
    const state = await failTimes(5);
    expect(state.locked).toBe(true);
    expect(state.retryAfterSeconds).toBe(300); // base lock

    await expect(
      service.assertNotLocked('login-account', 'user@example.com'),
    ).rejects.toThrow(HttpException);
  });

  it('reports 429 with a retry hint when locked', async () => {
    await failTimes(5);
    try {
      await service.assertNotLocked('login-account', 'user@example.com');
      fail('expected HttpException');
    } catch (error) {
      const response = (error as HttpException).getResponse() as any;
      expect((error as HttpException).getStatus()).toBe(429);
      expect(response.code).toBe('temporarily_locked');
      expect(response.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('doubles the lockout on repeated offenses (progressive backoff)', async () => {
    const firstLock = await failTimes(5);
    expect(firstLock.retryAfterSeconds).toBe(300);

    const secondLock = await failTimes(5);
    expect(secondLock.retryAfterSeconds).toBe(600);

    const thirdLock = await failTimes(5);
    expect(thirdLock.retryAfterSeconds).toBe(1200);
  });

  it('caps the progressive lockout at the policy maximum', async () => {
    process.env.LOCKOUT_LOGIN_ACCOUNT_MAX_LOCK_SECONDS = '700';
    await failTimes(5);
    const secondLock = await failTimes(5);
    expect(secondLock.retryAfterSeconds).toBe(600);
    const thirdLock = await failTimes(5);
    expect(thirdLock.retryAfterSeconds).toBe(700); // capped, not 1200
    delete process.env.LOCKOUT_LOGIN_ACCOUNT_MAX_LOCK_SECONDS;
  });

  it('clears the failure window on success', async () => {
    await failTimes(4);
    await service.recordSuccess('login-account', 'user@example.com');
    const state = await failTimes(4);
    expect(state.locked).toBe(false);
  });

  it('tracks scopes independently (account vs ip)', async () => {
    await failTimes(5);
    await expect(
      service.assertNotLocked('login-ip', '203.0.113.7'),
    ).resolves.toBeUndefined();
  });

  it('normalizes identifiers (case / whitespace)', async () => {
    await failTimes(5, 'User@Example.com ');
    await expect(
      service.assertNotLocked('login-account', 'user@example.com'),
    ).rejects.toThrow(HttpException);
  });

  it('emits lockout metrics', async () => {
    await failTimes(5);
    expect(metrics.record).toHaveBeenCalledWith(
      'account_locked',
      expect.objectContaining({ scope: 'login-account', lockSeconds: 300 }),
    );
  });

  it('honors env-driven thresholds', async () => {
    process.env.LOCKOUT_LOGIN_ACCOUNT_MAX_ATTEMPTS = '2';
    const state = await failTimes(2, 'other@example.com');
    expect(state.locked).toBe(true);
    delete process.env.LOCKOUT_LOGIN_ACCOUNT_MAX_ATTEMPTS;
  });

  it('works without Redis (in-memory fallback)', async () => {
    const memoryService = new LoginProtectionService(null, metrics);
    for (let i = 0; i < 5; i++) {
      await memoryService.recordFailure('login-account', 'user@example.com');
    }
    await expect(
      memoryService.assertNotLocked('login-account', 'user@example.com'),
    ).rejects.toThrow(HttpException);
  });
});
