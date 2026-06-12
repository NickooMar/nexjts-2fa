import {
  Get,
  Body,
  Post,
  UseGuards,
  Controller,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { firstValueFrom, Observable } from 'rxjs';
import { HttpException } from '@nestjs/common';
import { ROLES_THAT_MANAGE_BILLING } from 'apps/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../common/decorators/current-tenant.decorator';
import { CheckoutDto, ChangePlanDto } from 'libs/shared/dto/billing/checkout.dto';
import { BillingProxy } from 'apps/billing/src/infrastructure/external/billing.proxy';
import { PropertyProxy } from '../properties/property.proxy';
import { MediaProxy } from '../media/media.proxy';
import { MembershipProxy } from 'apps/user/src/infrastructure/external/membership.proxy';

interface AuthUser {
  _id: string;
  role: string;
  tenantId: string;
}

/** Service error codes the client can act on, with their HTTP mapping. */
const CLIENT_ERROR_STATUS: Record<string, number> = {
  plan_not_found: 404,
  plan_not_available: 400,
  already_subscribed: 400,
  already_cancelled: 400,
  not_cancelled: 400,
  nothing_to_retry: 400,
  billing_cycle_not_available: 400,
  downgrade_exceeds_limits: 400,
  payment_failed: 402,
};

/**
 * Organization billing endpoints. The organization is always resolved from
 * the JWT (CurrentTenant) — a member of several organizations manages each
 * org's independent subscription by switching tenants, and can never touch
 * another org's billing. Reads are open to every member; mutations are
 * restricted to billing-managing roles (owner).
 */
@Controller({ path: 'billing', version: '1' })
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    private readonly billingProxy: BillingProxy,
    private readonly propertyProxy: PropertyProxy,
    private readonly mediaProxy: MediaProxy,
    private readonly membershipProxy: MembershipProxy,
  ) {}

  /* ---------------------------------------------------------------- reads */

  @Get('plans')
  async listPlans() {
    const plans = await this.call(this.billingProxy.listPlans());
    return { success: true, plans };
  }

  @Get('subscription')
  async getSubscription(@CurrentTenant() tenant: TenantContext) {
    const overview = await this.call(
      this.billingProxy.getSubscription(tenant.tenantId),
    );
    return { success: true, ...overview };
  }

  @Get('entitlements')
  async getEntitlements(@CurrentTenant() tenant: TenantContext) {
    const entitlements = await this.call(
      this.billingProxy.getEntitlements(tenant.tenantId),
    );
    return { success: true, entitlements };
  }

  /**
   * Usage meters. Before reading, authoritative gauges (property count,
   * member count, stored bytes) are pulled from their source services and
   * pushed to billing (SYNC_USAGE), so the dashboard — and subsequent limit
   * checks — never show drifted event-sourced counters.
   */
  @Get('usage')
  async getUsage(@CurrentTenant() tenant: TenantContext) {
    await this.reconcileUsage(tenant).catch(() => undefined);
    const usage = await this.call(this.billingProxy.getUsage(tenant.tenantId));
    return { success: true, usage };
  }

  @Get('invoices')
  async listInvoices(@CurrentTenant() tenant: TenantContext) {
    const invoices = await this.call(
      this.billingProxy.listInvoices(tenant.tenantId),
    );
    return { success: true, invoices };
  }

  @Get('payments')
  async listPayments(@CurrentTenant() tenant: TenantContext) {
    const payments = await this.call(
      this.billingProxy.listPayments(tenant.tenantId),
    );
    return { success: true, payments };
  }

  /* ------------------------------------------------------------ mutations */

  @Post('checkout')
  async checkout(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Body() input: CheckoutDto,
  ) {
    this.assertCanManageBilling(user);
    const result = await this.call(
      this.billingProxy.checkout(
        tenant.tenantId,
        input.planSlug,
        input.billingCycle,
        user._id,
      ),
    );
    return { success: true, ...result };
  }

  @Post('change-plan')
  async changePlan(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Body() input: ChangePlanDto,
  ) {
    this.assertCanManageBilling(user);
    // Push fresh gauges first: downgrade guards compare usage to the target
    // plan's limits and must see authoritative numbers.
    await this.reconcileUsage(tenant).catch(() => undefined);
    const result = await this.call(
      this.billingProxy.changePlan(
        tenant.tenantId,
        input.planSlug,
        input.billingCycle,
        user._id,
      ),
    );
    return { success: true, ...result };
  }

  @Post('cancel')
  async cancel(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
  ) {
    this.assertCanManageBilling(user);
    const result = await this.call(
      this.billingProxy.cancelSubscription(tenant.tenantId),
    );
    return { success: true, ...result };
  }

  @Post('resume')
  async resume(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
  ) {
    this.assertCanManageBilling(user);
    const result = await this.call(
      this.billingProxy.resumeSubscription(tenant.tenantId),
    );
    return { success: true, ...result };
  }

  @Post('retry-payment')
  async retryPayment(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
  ) {
    this.assertCanManageBilling(user);
    const result = await this.call(
      this.billingProxy.retryPayment(tenant.tenantId),
    );
    return { success: true, ...result };
  }

  /* -------------------------------------------------------------- helpers */

  private assertCanManageBilling(user: AuthUser): void {
    if (!ROLES_THAT_MANAGE_BILLING.includes(user.role as never)) {
      throw new ForbiddenException('insufficient_permissions');
    }
  }

  /** Pull authoritative gauges and push them to the billing service. */
  private async reconcileUsage(tenant: TenantContext): Promise<void> {
    const [properties, members, storageBytes] = await Promise.all([
      firstValueFrom(this.propertyProxy.count(tenant.dbName)),
      firstValueFrom(this.membershipProxy.countByTenant(tenant.tenantId)),
      firstValueFrom(this.mediaProxy.totalSize({ dbName: tenant.dbName })),
    ]);
    await firstValueFrom(
      this.billingProxy.syncUsage(tenant.tenantId, {
        properties,
        members,
        storageBytes,
        activeListings: properties,
      }),
    );
  }

  /** Await an RPC and map service error codes to actionable HTTP errors. */
  private async call<T>(observable: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(observable);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      const message: string = error?.message ?? 'billing_error';
      const known = Object.keys(CLIENT_ERROR_STATUS).find((code) =>
        message.includes(code),
      );
      if (known) {
        const status = CLIENT_ERROR_STATUS[known];
        if (status === 404) throw new NotFoundException(known);
        if (status === 402) {
          throw new HttpException(
            { statusCode: 402, message: known },
            402,
          );
        }
        throw new BadRequestException(
          message.startsWith(known) ? message : known,
        );
      }
      throw new InternalServerErrorException(message);
    }
  }
}
