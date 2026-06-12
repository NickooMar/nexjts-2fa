import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ThrottlerGuard,
  ThrottlerStorage,
  ThrottlerModuleOptions,
  InjectThrottlerOptions,
  InjectThrottlerStorage,
} from '@nestjs/throttler';
import { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface';
import { getClientIp } from './client-ip.util';
import { SuspicionService } from './suspicion.service';
import { SecurityMetricsService } from './security-metrics.service';
import { rateLimitingEnabled } from './security.config';

/**
 * Global rate-limit guard for the gateway.
 *
 * Tracker resolution: requests carrying a *verified* JWT are keyed per user
 * (limits follow the account across IPs/NATs); everything else is keyed per
 * client IP. The signature check matters — an unverified `sub` claim would
 * let an attacker mint random identities to escape IP limits.
 *
 * Violations return a standardized 429 body with Retry-After, are logged as
 * structured security events, and raise the client's suspicion score.
 */
@Injectable()
export class GatewayThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly metrics: SecurityMetricsService,
    private readonly suspicion: SuspicionService,
  ) {
    super(options, storageService, reflector);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (!rateLimitingEnabled()) return true;
    const req = context.switchToHttp().getRequest();
    // Load balancer health checks must never be throttled.
    return req?.path === '/api/health';
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (req._rateLimitTracker) return req._rateLimitTracker;

    let tracker = `ip:${getClientIp(req)}`;
    const auth = req.headers?.authorization;
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      try {
        const payload = await this.jwtService.verifyAsync(auth.slice(7), {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
        if (payload?.sub) tracker = `user:${payload.sub}`;
      } catch {
        // Invalid/expired token → stay keyed by IP.
      }
    }
    req._rateLimitTracker = tracker;
    return tracker;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { req, res } = this.getRequestResponse(context);
    const retryAfterSeconds = Math.max(
      1,
      detail.isBlocked ? detail.timeToBlockExpire : detail.timeToExpire,
    );

    this.metrics.record('rate_limit_exceeded', {
      method: req.method,
      path: req.path,
      tracker: detail.tracker,
      limit: detail.limit,
      ttl: detail.ttl,
      totalHits: detail.totalHits,
      retryAfterSeconds,
    });
    if (req.securityContext) {
      this.suspicion.penalize(req.securityContext, 3);
    }

    res.header?.('Retry-After', String(retryAfterSeconds));
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        code: 'rate_limit_exceeded',
        message: `Rate limit exceeded. Try again in ${retryAfterSeconds}s.`,
        retryAfterSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
