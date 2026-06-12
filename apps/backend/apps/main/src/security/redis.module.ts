import Redis from 'ioredis';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from 'apps/env.validation';

/**
 * Shared Redis connection for all security primitives (throttler counters,
 * lockouts, suspicion scores, metrics). Resolves to `null` when REDIS_URL is
 * not configured — consumers then fall back to per-process in-memory state,
 * which is fine for a single dev instance but NOT for distributed
 * deployments, hence the loud warning in production.
 */
export const SECURITY_REDIS = 'SECURITY_REDIS';

export type SecurityRedis = Redis | null;

@Module({
  providers: [
    {
      provide: SECURITY_REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SecurityRedis => {
        const logger = new Logger('SecurityRedis');
        const url = config.get<string>('REDIS_URL');

        if (!url) {
          const env = config.get<string>('NODE_ENV');
          if (env === Environment.Production) {
            logger.error(
              'REDIS_URL is not set: rate limiting falls back to per-instance memory. ' +
                'Limits will NOT be shared across replicas — configure Redis/ElastiCache.',
            );
          } else {
            logger.warn(
              'REDIS_URL not set — using in-memory rate limiting (single instance only).',
            );
          }
          return null;
        }

        const client = new Redis(url, {
          // Fail fast: a slow/unreachable Redis must never stall requests.
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 2000,
          commandTimeout: 1000,
          keepAlive: 10000,
        });
        client.on('error', (err) =>
          logger.error(`Redis error: ${err.message}`),
        );
        client.on('ready', () => logger.log('Security Redis connected'));
        return client;
      },
    },
  ],
  exports: [SECURITY_REDIS],
})
export class SecurityRedisModule {}
