import type Redis from 'ioredis';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CaptchaGuard } from './captcha.guard';
import { getClientIp } from './client-ip.util';
import { envInt, seconds } from './security.config';
import { SuspicionService } from './suspicion.service';
import { GatewayThrottlerGuard } from './gateway-throttler.guard';
import { LoginProtectionGuard } from './login-protection.guard';
import { RedisThrottlerStorage } from './redis-throttler.storage';
import { LoginProtectionService } from './login-protection.service';
import { SecurityMetricsService } from './security-metrics.service';
import { SECURITY_REDIS, SecurityRedisModule } from './redis.module';
import { RequestFingerprintMiddleware } from './request-fingerprint.middleware';

/**
 * Gateway-wide abuse protection.
 *
 * Two global throttlers run on every route (storage shared via Redis so the
 * limits hold across replicas):
 *  - `ip`: a hard per-IP ceiling across ALL routes — the flood/bot gate.
 *  - `identity`: per-route budget keyed by authenticated user id (falls back
 *    to IP for anonymous traffic) — fair-use limiting that survives NAT.
 *
 * Sensitive endpoints tighten the `identity` budget via the decorators in
 * `throttle-policies.ts`. Limits resolve from env at request time.
 */
@Module({
  imports: [
    SecurityRedisModule,
    JwtModule.register({}),
    ThrottlerModule.forRootAsync({
      imports: [SecurityRedisModule],
      inject: [SECURITY_REDIS],
      useFactory: (redis: Redis | null) => ({
        storage: new RedisThrottlerStorage(redis),
        throttlers: [
          {
            name: 'ip',
            limit: () => envInt('RATE_LIMIT_IP_LIMIT', 300),
            ttl: () => seconds(envInt('RATE_LIMIT_IP_TTL_SECONDS', 60)),
            blockDuration: () =>
              seconds(envInt('RATE_LIMIT_IP_BLOCK_SECONDS', 60)),
            getTracker: (req) => `ip:${getClientIp(req)}`,
            // One bucket per IP across every route, on purpose.
            generateKey: (_context, tracker) => `global:${tracker}`,
          },
          {
            name: 'identity',
            limit: () => envInt('RATE_LIMIT_IDENTITY_LIMIT', 120),
            ttl: () => seconds(envInt('RATE_LIMIT_IDENTITY_TTL_SECONDS', 60)),
            blockDuration: () =>
              seconds(envInt('RATE_LIMIT_IDENTITY_BLOCK_SECONDS', 60)),
            // Tracker: guard default (verified user id, else client IP).
            // Key: throttler default (per route), so policies are per-endpoint.
          },
        ],
      }),
    }),
  ],
  providers: [
    SecurityMetricsService,
    SuspicionService,
    LoginProtectionService,
    LoginProtectionGuard,
    CaptchaGuard,
    RequestFingerprintMiddleware,
    { provide: APP_GUARD, useClass: GatewayThrottlerGuard },
  ],
  exports: [
    SecurityRedisModule,
    JwtModule,
    SecurityMetricsService,
    SuspicionService,
    LoginProtectionService,
    LoginProtectionGuard,
    CaptchaGuard,
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestFingerprintMiddleware).forRoutes('*');
  }
}
