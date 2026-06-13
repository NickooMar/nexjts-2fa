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
import { PropertyOwnerProxy } from './property-owner.proxy';
import { PropertyProxy } from '../properties/property.proxy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePropertyOwnerDto } from 'libs/shared/dto/property-owner/create-property-owner.dto';
import { UpdatePropertyOwnerDto } from 'libs/shared/dto/property-owner/update-property-owner.dto';
import { AttachPropertyOwnersDto } from 'libs/shared/dto/property-owner/attach-property-owners.dto';
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
const handleOwnerError = (fallback: string) => (error: any): never => {
  const message = error?.message || fallback;
  if (message.includes('property_owner_not_found')) {
    throw new NotFoundException('property_owner_not_found');
  }
  throw new InternalServerErrorException(message);
};

const assertCanManage = (user: AuthUser): void => {
  if (!ROLES_THAT_MANAGE_PROPERTIES.includes(user.role as never)) {
    throw new ForbiddenException('insufficient_permissions');
  }
};

/**
 * Organization-wide property-owner roster. These are people stored in the
 * tenant database — a separate roster from renters. Reads are open to any
 * member; writes use the property-manager roles.
 */
@Controller({ path: 'owners', version: '1' })
@UseGuards(JwtAuthGuard)
export class OwnersController {
  constructor(private readonly propertyOwnerProxy: PropertyOwnerProxy) {}

  @Get()
  async findAll(@CurrentTenant() tenant: TenantContext) {
    const owners = await firstValueFrom(
      this.propertyOwnerProxy.findAll(tenant.dbName),
    ).catch(handleOwnerError('Failed to list owners'));
    return { success: true, owners };
  }

  /** `propertyId` (optional query) attaches the new owner on create. */
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Body() input: CreatePropertyOwnerDto,
    @Query('propertyId') propertyId?: string,
  ) {
    assertCanManage(user);
    const created = await firstValueFrom(
      this.propertyOwnerProxy.create(
        tenant.dbName,
        input,
        propertyId || undefined,
        tenant.userId,
      ),
    ).catch(handleOwnerError('Failed to create owner'));
    return { success: true, owner: created };
  }

  @Patch(':ownerId')
  async update(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('ownerId') ownerId: string,
    @Body() input: UpdatePropertyOwnerDto,
  ) {
    assertCanManage(user);
    const updated = await firstValueFrom(
      this.propertyOwnerProxy.update(tenant.dbName, ownerId, input),
    ).catch(handleOwnerError('Failed to update owner'));
    return { success: true, owner: updated };
  }

  @Delete(':ownerId')
  async delete(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('ownerId') ownerId: string,
  ) {
    assertCanManage(user);
    const result = await firstValueFrom(
      this.propertyOwnerProxy.delete(tenant.dbName, ownerId),
    ).catch(handleOwnerError('Failed to delete owner'));
    return { success: true, deleted: result?.deleted ?? true };
  }
}

/**
 * Property-scoped owner links: who owns a given property. Attach/detach only
 * manipulate the link — owner records are owned by {@link OwnersController}.
 */
@Controller({ path: 'properties/:idOrSlug/owners', version: '1' })
@UseGuards(JwtAuthGuard)
export class PropertyOwnersController {
  constructor(
    private readonly propertyProxy: PropertyProxy,
    private readonly propertyOwnerProxy: PropertyOwnerProxy,
  ) {}

  @Get()
  async findByProperty(
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
  ) {
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    const owners = await firstValueFrom(
      this.propertyOwnerProxy.findByProperty(
        tenant.dbName,
        String(property._id),
      ),
    ).catch(handleOwnerError('Failed to list property owners'));
    return { success: true, owners };
  }

  /** Attach existing owners; returns the property's updated owner roster. */
  @Post('attach')
  async attach(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Body() input: AttachPropertyOwnersDto,
  ) {
    assertCanManage(user);
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    const owners = await firstValueFrom(
      this.propertyOwnerProxy.attach(
        tenant.dbName,
        String(property._id),
        input.ownerIds,
      ),
    ).catch(handleOwnerError('Failed to attach owners'));
    return { success: true, owners };
  }

  @Delete(':ownerId')
  async detach(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Param('ownerId') ownerId: string,
  ) {
    assertCanManage(user);
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    await firstValueFrom(
      this.propertyOwnerProxy.detach(
        tenant.dbName,
        String(property._id),
        ownerId,
      ),
    ).catch(handleOwnerError('Failed to detach owner'));
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
