import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { PropertyOwnerPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { PropertyOwner } from '../../domain/entities/property-owner.entity';
import { CreatePropertyOwnerDto } from 'libs/shared/dto/property-owner/create-property-owner.dto';
import { UpdatePropertyOwnerDto } from 'libs/shared/dto/property-owner/update-property-owner.dto';
import { PropertyOwnerService } from '../../domain/services/property-owner.service';

/**
 * Property owners = people who own a property, stored in the tenant database
 * (separate roster from renters). Every payload carries the resolved tenant
 * `dbName` supplied by the gateway.
 */
@Controller()
export class PropertyOwnerController {
  constructor(private readonly propertyOwnerService: PropertyOwnerService) {}

  @MessagePattern({ cmd: PropertyOwnerPatterns.CREATE })
  create(payload: {
    dbName: string;
    propertyId?: string;
    createdBy?: string;
    data: CreatePropertyOwnerDto;
  }): Observable<PropertyOwner> {
    return this.propertyOwnerService.create(
      payload.dbName,
      payload.data,
      payload.propertyId,
      payload.createdBy,
    );
  }

  @MessagePattern({ cmd: PropertyOwnerPatterns.FIND_ALL })
  findAll(payload: { dbName: string }): Observable<PropertyOwner[]> {
    return this.propertyOwnerService.findAll(payload.dbName);
  }

  @MessagePattern({ cmd: PropertyOwnerPatterns.FIND_BY_PROPERTY })
  findByProperty(payload: {
    dbName: string;
    propertyId: string;
  }): Observable<PropertyOwner[]> {
    return this.propertyOwnerService.findByProperty(
      payload.dbName,
      payload.propertyId,
    );
  }

  @MessagePattern({ cmd: PropertyOwnerPatterns.UPDATE })
  update(payload: {
    dbName: string;
    id: string;
    data: UpdatePropertyOwnerDto;
  }): Observable<PropertyOwner> {
    return this.propertyOwnerService.update(
      payload.dbName,
      payload.id,
      payload.data,
    );
  }

  @MessagePattern({ cmd: PropertyOwnerPatterns.ATTACH })
  attach(payload: {
    dbName: string;
    propertyId: string;
    contactIds: string[];
  }): Observable<PropertyOwner[]> {
    return this.propertyOwnerService.attach(
      payload.dbName,
      payload.propertyId,
      payload.contactIds,
    );
  }

  @MessagePattern({ cmd: PropertyOwnerPatterns.DETACH })
  detach(payload: {
    dbName: string;
    propertyId: string;
    contactId: string;
  }): Observable<{ detached: boolean }> {
    return this.propertyOwnerService.detach(
      payload.dbName,
      payload.propertyId,
      payload.contactId,
    );
  }

  @MessagePattern({ cmd: PropertyOwnerPatterns.DELETE })
  delete(payload: {
    dbName: string;
    id: string;
  }): Observable<{ deleted: boolean }> {
    return this.propertyOwnerService.delete(payload.dbName, payload.id);
  }
}
