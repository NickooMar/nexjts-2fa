import { from, Observable } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { PropertyContact } from '../entities/property-contact.entity';
import { CreatePropertyContactDto } from 'libs/shared/dto/property-contact/property-contact.dto';
import { UpdatePropertyContactDto } from 'libs/shared/dto/property-contact/property-contact.dto';
import {
  PropertyContactRepository,
  CreatePropertyContactRecord,
} from '../../infrastructure/repository/property-contact.repository';

/**
 * Shared business logic for property contacts (renters and owners). Concrete
 * services bind it to a repository and a `notFoundCode` so error messages are
 * role-specific (`property_tenant_not_found` / `property_owner_not_found`).
 */
export abstract class PropertyContactService<
  TEntity extends PropertyContact = PropertyContact,
> {
  protected abstract readonly repository: PropertyContactRepository<TEntity>;
  /** RPC error code thrown when a contact can't be found. */
  protected abstract readonly notFoundCode: string;

  /** `propertyId` (optional) attaches the new contact to a property on create. */
  create(
    dbName: string,
    input: CreatePropertyContactDto,
    propertyId?: string,
    createdBy?: string,
  ): Observable<TEntity> {
    const record: CreatePropertyContactRecord = {
      ...input,
      propertyIds: propertyId ? [propertyId] : [],
    };
    return from(this.repository.create(dbName, record, createdBy));
  }

  findAll(dbName: string): Observable<TEntity[]> {
    return from(this.repository.findAll(dbName));
  }

  findByProperty(dbName: string, propertyId: string): Observable<TEntity[]> {
    return from(this.repository.findByProperty(dbName, propertyId));
  }

  update(
    dbName: string,
    id: string,
    changes: UpdatePropertyContactDto,
  ): Observable<TEntity> {
    return from(
      (async () => {
        const existing = await this.repository.findByIdOrUuid(dbName, id);
        if (!existing) throw new RpcException(this.notFoundCode);

        const updated = await this.repository.update(
          dbName,
          String(existing._id),
          { ...changes },
        );
        if (!updated) throw new RpcException(this.notFoundCode);
        return updated;
      })(),
    );
  }

  /** Attach existing contacts to a property; returns the updated roster. */
  attach(
    dbName: string,
    propertyId: string,
    contactIds: string[],
  ): Observable<TEntity[]> {
    return from(
      (async () => {
        await this.repository.attachToProperty(dbName, propertyId, contactIds);
        return this.repository.findByProperty(dbName, propertyId);
      })(),
    );
  }

  /** Detach unlinks the contact from the property; their record survives. */
  detach(
    dbName: string,
    propertyId: string,
    contactId: string,
  ): Observable<{ detached: boolean }> {
    return from(
      (async () => {
        const detached = await this.repository.detachFromProperty(
          dbName,
          propertyId,
          contactId,
        );
        if (!detached) throw new RpcException(this.notFoundCode);
        return { detached };
      })(),
    );
  }

  delete(dbName: string, id: string): Observable<{ deleted: boolean }> {
    return from(
      (async () => {
        const existing = await this.repository.findByIdOrUuid(dbName, id);
        if (!existing) throw new RpcException(this.notFoundCode);
        const deleted = await this.repository.delete(
          dbName,
          String(existing._id),
        );
        return { deleted };
      })(),
    );
  }
}
