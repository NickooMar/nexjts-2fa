import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { TENANT_DB_PREFIX } from 'apps/constants';

export interface TenantContext {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  /** Physical database name for the tenant's data plane. */
  dbName: string;
}

/**
 * Builds the tenant routing context from the authenticated user (populated by
 * the JWT strategy). The access token is the single source of truth — a client
 * cannot override which tenant it belongs to.
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.tenantId) {
      throw new BadRequestException('missing_tenant_context');
    }

    const dbName =
      user.tenantDb ||
      (user.tenantSlug ? `${TENANT_DB_PREFIX}${user.tenantSlug}` : undefined);

    if (!dbName) {
      throw new BadRequestException('missing_tenant_database');
    }

    return {
      userId: String(user._id ?? user.sub),
      tenantId: String(user.tenantId),
      tenantSlug: user.tenantSlug,
      dbName,
    };
  },
);
