import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { PropertyPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { Property } from '../../domain/entities/property.entity';
import { CreatePropertyDto } from 'libs/shared/dto/property/create-property.dto';
import { UpdatePropertyDto } from 'libs/shared/dto/property/update-property.dto';
import { PropertyService } from '../../domain/services/property.service';

/**
 * Every payload carries the resolved tenant `dbName` (derived from the JWT by
 * the gateway) so the service reads/writes the correct tenant database.
 */
@Controller()
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @MessagePattern({ cmd: PropertyPatterns.CREATE })
  create(payload: {
    dbName: string;
    organizationId: string;
    createdBy?: string;
    data: CreatePropertyDto;
  }): Observable<Property> {
    return this.propertyService.create(
      payload.dbName,
      payload.data,
      payload.organizationId,
      payload.createdBy,
    );
  }

  @MessagePattern({ cmd: PropertyPatterns.FIND_ALL })
  findAll(payload: { dbName: string }): Observable<Property[]> {
    return this.propertyService.findAll(payload.dbName);
  }

  @MessagePattern({ cmd: PropertyPatterns.COUNT })
  count(payload: { dbName: string }): Observable<number> {
    return this.propertyService.count(payload.dbName);
  }

  @MessagePattern({ cmd: PropertyPatterns.FIND_BY_ID })
  findById(payload: {
    dbName: string;
    id: string;
  }): Observable<Property | null> {
    return this.propertyService.findById(payload.dbName, payload.id);
  }

  @MessagePattern({ cmd: PropertyPatterns.FIND_ONE })
  findOne(payload: { dbName: string; idOrSlug: string }): Observable<Property> {
    return this.propertyService.findByIdOrSlug(
      payload.dbName,
      payload.idOrSlug,
    );
  }

  @MessagePattern({ cmd: PropertyPatterns.UPDATE })
  update(payload: {
    dbName: string;
    idOrSlug: string;
    data: UpdatePropertyDto;
  }): Observable<Property> {
    return this.propertyService.update(
      payload.dbName,
      payload.idOrSlug,
      payload.data,
    );
  }

  @MessagePattern({ cmd: PropertyPatterns.DELETE })
  delete(payload: {
    dbName: string;
    idOrSlug: string;
  }): Observable<{ deleted: boolean }> {
    return this.propertyService.delete(payload.dbName, payload.idOrSlug);
  }
}
