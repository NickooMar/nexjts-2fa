import RedisMock from 'ioredis-mock';
import type Redis from 'ioredis';
import { RedisThrottlerStorage } from './redis-throttler.storage';

describe('RedisThrottlerStorage', () => {
  let redis: Redis;
  let storage: RedisThrottlerStorage;

  beforeEach(() => {
    redis = new RedisMock() as unknown as Redis;
    storage = new RedisThrottlerStorage(redis);
  });

  afterEach(async () => {
    await (redis as any).flushall();
  });

  it('counts hits within the window', async () => {
    const first = await storage.increment('k', 60_000, 5, 60_000, 'identity');
    const second = await storage.increment('k', 60_000, 5, 60_000, 'identity');

    expect(first.totalHits).toBe(1);
    expect(second.totalHits).toBe(2);
    expect(second.isBlocked).toBe(false);
    expect(second.timeToExpire).toBeGreaterThan(0);
    expect(second.timeToExpire).toBeLessThanOrEqual(60);
  });

  it('blocks once the limit is exceeded and stays blocked', async () => {
    for (let i = 0; i < 3; i++) {
      await storage.increment('k', 60_000, 3, 120_000, 'identity');
    }
    const exceeded = await storage.increment(
      'k',
      60_000,
      3,
      120_000,
      'identity',
    );
    expect(exceeded.isBlocked).toBe(true);
    expect(exceeded.timeToBlockExpire).toBeGreaterThan(0);
    expect(exceeded.timeToBlockExpire).toBeLessThanOrEqual(120);

    // Subsequent requests do not extend the counter, just report the block.
    const whileBlocked = await storage.increment(
      'k',
      60_000,
      3,
      120_000,
      'identity',
    );
    expect(whileBlocked.isBlocked).toBe(true);
  });

  it('keeps independent counters per key', async () => {
    await storage.increment('a', 60_000, 5, 60_000, 'identity');
    const other = await storage.increment('b', 60_000, 5, 60_000, 'identity');
    expect(other.totalHits).toBe(1);
  });

  it('resets after the window expires', async () => {
    await storage.increment('k', 250, 5, 250, 'identity');
    await new Promise((resolve) => setTimeout(resolve, 400));
    const afterExpiry = await storage.increment('k', 250, 5, 250, 'identity');
    expect(afterExpiry.totalHits).toBe(1);
  });

  it('shares counters between instances (distributed deployment)', async () => {
    // Two gateway replicas → two storage instances, one Redis.
    const replicaA = new RedisThrottlerStorage(redis);
    const replicaB = new RedisThrottlerStorage(
      (redis as any).duplicate() as Redis,
    );

    await replicaA.increment('k', 60_000, 2, 60_000, 'identity');
    await replicaB.increment('k', 60_000, 2, 60_000, 'identity');
    const third = await replicaA.increment('k', 60_000, 2, 60_000, 'identity');

    expect(third.totalHits).toBe(3);
    expect(third.isBlocked).toBe(true);
  });

  it('fails open when Redis errors at runtime', async () => {
    process.env.RATE_LIMIT_FAIL_OPEN = 'true';
    const broken = {
      eval: jest.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as Redis;

    const record = await new RedisThrottlerStorage(broken).increment(
      'k',
      60_000,
      5,
      60_000,
      'identity',
    );
    expect(record.isBlocked).toBe(false);
    delete process.env.RATE_LIMIT_FAIL_OPEN;
  });

  it('fails closed when configured to', async () => {
    process.env.RATE_LIMIT_FAIL_OPEN = 'false';
    const broken = {
      eval: jest.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as Redis;

    await expect(
      new RedisThrottlerStorage(broken).increment(
        'k',
        60_000,
        5,
        60_000,
        'identity',
      ),
    ).rejects.toThrow('connection refused');
    delete process.env.RATE_LIMIT_FAIL_OPEN;
  });

  it('uses in-memory fallback when Redis is not configured', async () => {
    const memoryOnly = new RedisThrottlerStorage(null);
    const first = await memoryOnly.increment(
      'k',
      60_000,
      5,
      60_000,
      'identity',
    );
    const second = await memoryOnly.increment(
      'k',
      60_000,
      5,
      60_000,
      'identity',
    );
    expect(first.totalHits).toBe(1);
    expect(second.totalHits).toBe(2);
  });
});
