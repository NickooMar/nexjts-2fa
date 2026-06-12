import {
  Get,
  Body,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  Observable,
  catchError,
  map,
  switchMap,
  from,
  throwError,
  firstValueFrom,
} from 'rxjs';
import { PropertyProxy } from './property.proxy';
import { StorageService } from 'libs/storage/storage.service';
import { MediaUrlService } from '../media/media-url.service';
import {
  BillingEventPatterns,
  ROLES_THAT_MANAGE_PROPERTIES,
} from 'apps/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanEnforcementService } from '../billing/plan-enforcement.service';
import { BillingProxy } from 'apps/billing/src/infrastructure/external/billing.proxy';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePropertyDto } from 'libs/shared/dto/property/create-property.dto';
import { UpdatePropertyDto } from 'libs/shared/dto/property/update-property.dto';
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
const handlePropertyError = (fallback: string) => (error: any) => {
  const message = error?.message || fallback;
  if (message.includes('property_not_found')) {
    throw new NotFoundException('property_not_found');
  }
  throw new InternalServerErrorException(message);
};

@Controller({ path: 'properties', version: '1' })
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(
    private readonly propertyProxy: PropertyProxy,
    private readonly mediaUrl: MediaUrlService,
    private readonly storage: StorageService,
    private readonly billingProxy: BillingProxy,
    private readonly planEnforcement: PlanEnforcementService,
  ) {}

  /** Any member of the organization may read; writes need manager or above. */
  private assertCanManage(user: AuthUser): Observable<never> | null {
    if (!ROLES_THAT_MANAGE_PROPERTIES.includes(user.role as never)) {
      return throwError(
        () => new ForbiddenException('insufficient_permissions'),
      );
    }
    return null;
  }

  @Get()
  findAll(@CurrentTenant() tenant: TenantContext): Observable<any> {
    return this.propertyProxy.findAll(tenant.dbName).pipe(
      // Swap internal storage keys for browser-usable (signed/public) URLs.
      switchMap((properties) =>
        from(this.mediaUrl.enrichPropertyList(properties)),
      ),
      map((properties) => ({ success: true, properties })),
      catchError(handlePropertyError('Failed to list properties')),
    );
  }

  @Get(':idOrSlug')
  findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
  ): Observable<any> {
    return this.propertyProxy.findOne(tenant.dbName, idOrSlug).pipe(
      switchMap((property) =>
        from(this.mediaUrl.enrichPropertyDetail(property)),
      ),
      map((property) => ({ success: true, property })),
      catchError(handlePropertyError('Failed to fetch property')),
    );
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Body() input: CreatePropertyDto,
  ): Promise<any> {
    if (!ROLES_THAT_MANAGE_PROPERTIES.includes(user.role as never)) {
      throw new ForbiddenException('insufficient_permissions');
    }

    // Server-side plan enforcement: the live count is authoritative, so a
    // full plan can never be exceeded — regardless of what the client shows.
    const current = await firstValueFrom(
      this.propertyProxy.count(tenant.dbName),
    );
    await this.planEnforcement.assertCanCreateProperty(
      tenant.tenantId,
      current,
    );

    return firstValueFrom(
      this.propertyProxy
        .create(tenant.dbName, tenant.tenantId, input, tenant.userId)
        .pipe(
          map((property) => {
            this.billingProxy.emitUsageEvent(
              BillingEventPatterns.PROPERTY_CREATED,
              { organizationId: tenant.tenantId },
            );
            return { success: true, property };
          }),
          catchError(handlePropertyError('Failed to create property')),
        ),
    );
  }

  @Patch(':idOrSlug')
  update(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Body() input: UpdatePropertyDto,
  ): Observable<any> {
    return (
      this.assertCanManage(user) ??
      this.propertyProxy.update(tenant.dbName, idOrSlug, input).pipe(
        map((property) => ({ success: true, property })),
        catchError(handlePropertyError('Failed to update property')),
      )
    );
  }

  @Delete(':idOrSlug')
  delete(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
  ): Observable<any> {
    return (
      this.assertCanManage(user) ??
      this.propertyProxy.delete(tenant.dbName, idOrSlug).pipe(
        map((result) => {
          // Metadata records are gone; purge the orphaned bucket objects
          // best-effort (a failure here must not fail the delete).
          const mediaKeys: string[] = result?.mediaKeys ?? [];
          if (mediaKeys.length > 0) {
            void this.storage.deleteMany(mediaKeys).catch(() => undefined);
          }
          this.billingProxy.emitUsageEvent(
            BillingEventPatterns.PROPERTY_DELETED,
            { organizationId: tenant.tenantId },
          );
          return { success: true, deleted: result?.deleted ?? true };
        }),
        catchError(handlePropertyError('Failed to delete property')),
      )
    );
  }
}
