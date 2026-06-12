import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { getClientIp } from './client-ip.util';
import { LoginProtectionService } from './login-protection.service';

/**
 * Rejects signin attempts for accounts/IPs that are temporarily locked out
 * after repeated failures, *before* the request reaches the auth service
 * (no bcrypt work, no microservice hop for blocked attackers). The
 * controller reports success/failure outcomes back to the service.
 */
@Injectable()
export class LoginProtectionGuard implements CanActivate {
  constructor(private readonly loginProtection: LoginProtectionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const email = typeof req.body?.email === 'string' ? req.body.email : null;

    await this.loginProtection.assertNotLocked('login-ip', getClientIp(req));
    if (email) {
      await this.loginProtection.assertNotLocked('login-account', email);
    }
    return true;
  }
}
