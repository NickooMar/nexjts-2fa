import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { PropertyTenantPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { PropertyTenant } from '../../domain/entities/property-tenant.entity';
import { CreatePropertyTenantDto } from 'libs/shared/dto/property-tenant/create-property-tenant.dto';
import { UpdatePropertyTenantDto } from 'libs/shared/dto/property-tenant/update-property-tenant.dto';
import { PropertyTenantService } from '../../domain/services/property-tenant.service';

/**
 * Property tenants = renters/occupants in the tenant database (unrelated to
 * the control-plane `Tenant` organization document). Every payload carries
 * the resolved tenant `dbName` supplied by the gateway.
 */
@Controller()
export class PropertyTenantController {
  constructor(private readonly propertyTenantService: PropertyTenantService) {}

  @MessagePattern({ cmd: PropertyTenantPatterns.CREATE })
  create(payload: {
    dbName: string;
    propertyId?: string;
    createdBy?: string;
    data: CreatePropertyTenantDto;
  }): Observable<PropertyTenant> {
    return this.propertyTenantService.create(
      payload.dbName,
      payload.data,
      payload.propertyId,
      payload.createdBy,
    );
  }

  @MessagePattern({ cmd: PropertyTenantPatterns.FIND_ALL })
  findAll(payload: { dbName: string }): Observable<PropertyTenant[]> {
    return this.propertyTenantService.findAll(payload.dbName);
  }

  @MessagePattern({ cmd: PropertyTenantPatterns.FIND_BY_PROPERTY })
  findByProperty(payload: {
    dbName: string;
    propertyId: string;
  }): Observable<PropertyTenant[]> {
    return this.propertyTenantService.findByProperty(
      payload.dbName,
      payload.propertyId,
    );
  }

  @MessagePattern({ cmd: PropertyTenantPatterns.UPDATE })
  update(payload: {
    dbName: string;
    id: string;
    data: UpdatePropertyTenantDto;
  }): Observable<PropertyTenant> {
    return this.propertyTenantService.update(
      payload.dbName,
      payload.id,
      payload.data,
    );
  }

  @MessagePattern({ cmd: PropertyTenantPatterns.ATTACH })
  attach(payload: {
    dbName: string;
    propertyId: string;
    contactIds: string[];
  }): Observable<PropertyTenant[]> {
    return this.propertyTenantService.attach(
      payload.dbName,
      payload.propertyId,
      payload.contactIds,
    );
  }

  @MessagePattern({ cmd: PropertyTenantPatterns.DETACH })
  detach(payload: {
    dbName: string;
    propertyId: string;
    contactId: string;
  }): Observable<{ detached: boolean }> {
    return this.propertyTenantService.detach(
      payload.dbName,
      payload.propertyId,
      payload.contactId,
    );
  }

  @MessagePattern({ cmd: PropertyTenantPatterns.DELETE })
  delete(payload: {
    dbName: string;
    id: string;
  }): Observable<{ deleted: boolean }> {
    return this.propertyTenantService.delete(payload.dbName, payload.id);
  }
}
