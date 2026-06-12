import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { SuspicionService } from './suspicion.service';

/**
 * Attaches the security context (client IP, fingerprint, bot signals) to
 * every request and feeds header-based signals into the suspicion score.
 * Purely additive — it never blocks; blocking decisions belong to the
 * throttler guard, lockout service and captcha guard.
 */
@Injectable()
export class RequestFingerprintMiddleware implements NestMiddleware {
  constructor(private readonly suspicion: SuspicionService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const ctx = this.suspicion.buildContext(req);
    req.securityContext = ctx;
    if (ctx.signals.length > 0) {
      this.suspicion.penalize(ctx, ctx.signals.length);
    }
    next();
  }
}
