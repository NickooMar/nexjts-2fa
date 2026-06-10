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
import { Observable, catchError, map, throwError } from 'rxjs';
import { PropertyProxy } from './property.proxy';
import { ROLES_THAT_MANAGE_PROPERTIES } from 'apps/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  constructor(private readonly propertyProxy: PropertyProxy) {}

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
      map((property) => ({ success: true, property })),
      catchError(handlePropertyError('Failed to fetch property')),
    );
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Body() input: CreatePropertyDto,
  ): Observable<any> {
    return (
      this.assertCanManage(user) ??
      this.propertyProxy
        .create(tenant.dbName, tenant.tenantId, input, tenant.userId)
        .pipe(
          map((property) => ({ success: true, property })),
          catchError(handlePropertyError('Failed to create property')),
        )
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
        map((result) => ({ success: true, deleted: result?.deleted ?? true })),
        catchError(handlePropertyError('Failed to delete property')),
      )
    );
  }
}
