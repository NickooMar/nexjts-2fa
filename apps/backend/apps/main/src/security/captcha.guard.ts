import {
  Logger,
  Injectable,
  CanActivate,
  HttpException,
  HttpStatus,
  ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { SuspicionService } from './suspicion.service';
import { SecurityMetricsService } from './security-metrics.service';
import { captchaConfig, CAPTCHA_VERIFY_URLS } from './security.config';
import { getClientIp } from './client-ip.util';

/**
 * Optional CAPTCHA enforcement for high-risk endpoints (signin/signup).
 * Disabled by default; when CAPTCHA_ENABLED=true it challenges either every
 * request (CAPTCHA_MODE=always) or only clients the suspicion engine has
 * flagged (CAPTCHA_MODE=flagged, the default), keeping friction off normal
 * users. Tokens come from the `x-captcha-token` header (or `captchaToken` in
 * the body) and are verified against Turnstile/reCAPTCHA.
 */
@Injectable()
export class CaptchaGuard implements CanActivate {
  private readonly logger = new Logger(CaptchaGuard.name);

  constructor(
    private readonly suspicion: SuspicionService,
    private readonly metrics: SecurityMetricsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = captchaConfig();
    if (!config.enabled) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const fingerprint =
      req.securityContext?.fingerprint ??
      this.suspicion.buildContext(req).fingerprint;

    if (
      config.mode === 'flagged' &&
      !(await this.suspicion.isFlagged(fingerprint))
    ) {
      return true;
    }

    const token =
      (req.headers['x-captcha-token'] as string) ||
      (req.body?.captchaToken as string);
    if (!token) {
      this.metrics.record('captcha_required', { path: req.path, fingerprint });
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Forbidden',
          code: 'captcha_required',
          message: 'Please complete the CAPTCHA challenge and retry.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (await this.verify(token, getClientIp(req), config)) return true;

    this.metrics.record('captcha_failed', { path: req.path, fingerprint });
    if (req.securityContext) this.suspicion.penalize(req.securityContext, 5);
    throw new HttpException(
      {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
        code: 'captcha_invalid',
        message: 'CAPTCHA verification failed.',
      },
      HttpStatus.FORBIDDEN,
    );
  }

  private async verify(
    token: string,
    ip: string,
    config: ReturnType<typeof captchaConfig>,
  ): Promise<boolean> {
    const url = config.verifyUrl || CAPTCHA_VERIFY_URLS[config.provider];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: config.secret,
          response: token,
          remoteip: ip,
        }),
      });
      const result = (await response.json()) as { success?: boolean };
      return result.success === true;
    } catch (error) {
      // Provider outage must not lock users out of signin: fail open.
      this.logger.error(
        `CAPTCHA verification unavailable (${(error as Error).message}) — failing open`,
      );
      return true;
    } finally {
      clearTimeout(timer);
    }
  }
}
