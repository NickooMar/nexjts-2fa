import type Redis from 'ioredis';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { rateLimitFailOpen } from './security.config';

/**
 * Fixed-window counter + block flag, evaluated atomically so concurrent
 * requests across many gateway replicas can never double-admit.
 *
 * KEYS[1] hit counter   KEYS[2] block flag
 * ARGV[1] ttl ms        ARGV[2] limit        ARGV[3] block duration ms
 * Returns { hits, counterPttl, isBlocked, blockPttl }.
 */
const INCREMENT_SCRIPT = `
local blockTtl = redis.call('PTTL', KEYS[2])
if blockTtl > 0 then
  local hits = tonumber(redis.call('GET', KEYS[1]) or '0')
  return { hits, redis.call('PTTL', KEYS[1]), 1, blockTtl }
end

local hits = redis.call('INCR', KEYS[1])
if hits == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local counterTtl = redis.call('PTTL', KEYS[1])

if hits > tonumber(ARGV[2]) then
  redis.call('SET', KEYS[2], '1', 'PX', ARGV[3])
  return { hits, counterTtl, 1, tonumber(ARGV[3]) }
end
return { hits, counterTtl, 0, 0 }
`;

/**
 * Centralized throttler storage: shared counters in Redis so limits hold
 * across all gateway replicas. Falls back to the library's in-memory storage
 * when Redis is not configured, and fails open (configurable) when Redis
 * errors at runtime, preferring availability over strict limiting.
 */
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly memoryFallback = new ThrottlerStorageService();

  constructor(private readonly redis: Redis | null) {}

  onApplicationShutdown(): void {
    this.memoryFallback.onApplicationShutdown();
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    if (!this.redis) {
      return this.memoryFallback.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );
    }

    try {
      const [hits, counterPttl, blocked, blockPttl] = (await this.redis.eval(
        INCREMENT_SCRIPT,
        2,
        `rl:{${key}}:hits`,
        `rl:{${key}}:block`,
        ttl,
        limit,
        blockDuration > 0 ? blockDuration : ttl,
      )) as [number, number, number, number];

      return {
        totalHits: hits,
        timeToExpire: Math.max(0, Math.ceil(counterPttl / 1000)),
        isBlocked: blocked === 1,
        timeToBlockExpire: Math.max(0, Math.ceil(blockPttl / 1000)),
      };
    } catch (error) {
      const failOpen = rateLimitFailOpen();
      this.logger.error(
        `Redis increment failed (${(error as Error).message}) — ` +
          (failOpen ? 'failing open' : 'failing closed'),
      );
      if (failOpen) {
        return {
          totalHits: 1,
          timeToExpire: Math.ceil(ttl / 1000),
          isBlocked: false,
          timeToBlockExpire: 0,
        };
      }
      throw error;
    }
  }
}
