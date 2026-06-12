import {
  Get,
  Body,
  Post,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ROLES_THAT_MANAGE_PROPERTIES } from 'apps/constants';
import { PropertyTenantProxy } from './property-tenant.proxy';
import { PropertyProxy } from '../properties/property.proxy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePropertyTenantDto } from 'libs/shared/dto/property-tenant/create-property-tenant.dto';
import { UpdatePropertyTenantDto } from 'libs/shared/dto/property-tenant/update-property-tenant.dto';
import { AttachPropertyTenantsDto } from 'libs/shared/dto/property-tenant/attach-property-tenants.dto';
import {
  CurrentTenant,
  TenantContext,
} from '../common/decorators/current-tenant.decorator';

interface AuthUser {
  _id: string;
  role: string;
  tenantId: string;
}

/** Map service error codes to HTTP responses the client can act on. */
const handleTenantError = (fallback: string) => (error: any): never => {
  const message = error?.message || fallback;
  if (message.includes('property_tenant_not_found')) {
    throw new NotFoundException('property_tenant_not_found');
  }
  throw new InternalServerErrorException(message);
};

const assertCanManage = (user: AuthUser): void => {
  if (!ROLES_THAT_MANAGE_PROPERTIES.includes(user.role as never)) {
    throw new ForbiddenException('insufficient_permissions');
  }
};

/**
 * Organization-wide property-tenant (renter) roster. These are people stored
 * in the tenant database — unrelated to the `Tenant` organization document.
 * Reads are open to any member; writes use the property-manager roles.
 */
@Controller({ path: 'tenants', version: '1' })
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly propertyTenantProxy: PropertyTenantProxy) {}

  @Get()
  async findAll(@CurrentTenant() tenant: TenantContext) {
    const tenants = await firstValueFrom(
      this.propertyTenantProxy.findAll(tenant.dbName),
    ).catch(handleTenantError('Failed to list tenants'));
    return { success: true, tenants };
  }

  /** `propertyId` (optional query) attaches the new tenant on create. */
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Body() input: CreatePropertyTenantDto,
    @Query('propertyId') propertyId?: string,
  ) {
    assertCanManage(user);
    const created = await firstValueFrom(
      this.propertyTenantProxy.create(
        tenant.dbName,
        input,
        propertyId || undefined,
        tenant.userId,
      ),
    ).catch(handleTenantError('Failed to create tenant'));
    return { success: true, tenant: created };
  }

  @Patch(':tenantId')
  async update(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('tenantId') tenantId: string,
    @Body() input: UpdatePropertyTenantDto,
  ) {
    assertCanManage(user);
    const updated = await firstValueFrom(
      this.propertyTenantProxy.update(tenant.dbName, tenantId, input),
    ).catch(handleTenantError('Failed to update tenant'));
    return { success: true, tenant: updated };
  }

  @Delete(':tenantId')
  async delete(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('tenantId') tenantId: string,
  ) {
    assertCanManage(user);
    const result = await firstValueFrom(
      this.propertyTenantProxy.delete(tenant.dbName, tenantId),
    ).catch(handleTenantError('Failed to delete tenant'));
    return { success: true, deleted: result?.deleted ?? true };
  }
}

/**
 * Property-scoped tenant links: who occupies a given property. Attach/detach
 * only manipulate the link — tenant records are owned by {@link TenantsController}.
 */
@Controller({ path: 'properties/:idOrSlug/tenants', version: '1' })
@UseGuards(JwtAuthGuard)
export class PropertyTenantsController {
  constructor(
    private readonly propertyProxy: PropertyProxy,
    private readonly propertyTenantProxy: PropertyTenantProxy,
  ) {}

  @Get()
  async findByProperty(
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
  ) {
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    const tenants = await firstValueFrom(
      this.propertyTenantProxy.findByProperty(
        tenant.dbName,
        String(property._id),
      ),
    ).catch(handleTenantError('Failed to list property tenants'));
    return { success: true, tenants };
  }

  /** Attach existing tenants; returns the property's updated roster. */
  @Post('attach')
  async attach(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Body() input: AttachPropertyTenantsDto,
  ) {
    assertCanManage(user);
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    const tenants = await firstValueFrom(
      this.propertyTenantProxy.attach(
        tenant.dbName,
        String(property._id),
        input.tenantIds,
      ),
    ).catch(handleTenantError('Failed to attach tenants'));
    return { success: true, tenants };
  }

  @Delete(':tenantId')
  async detach(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Param('tenantId') tenantId: string,
  ) {
    assertCanManage(user);
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    await firstValueFrom(
      this.propertyTenantProxy.detach(
        tenant.dbName,
        String(property._id),
        tenantId,
      ),
    ).catch(handleTenantError('Failed to detach tenant'));
    return { success: true, detached: true };
  }

  private async resolveProperty(dbName: string, idOrSlug: string) {
    return firstValueFrom(this.propertyProxy.findOne(dbName, idOrSlug)).catch(
      () => {
        throw new NotFoundException('property_not_found');
      },
    );
  }
}
