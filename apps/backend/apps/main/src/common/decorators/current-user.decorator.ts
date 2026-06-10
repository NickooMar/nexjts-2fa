import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Returns the authenticated user (populated by the JWT strategy), including the
 * signed tenant claims (`tenantId`, `tenantSlug`, `tenantDb`, `role`).
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  },
);
