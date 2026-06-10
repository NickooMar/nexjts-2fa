import { from, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { slugify } from 'libs/shared/utils/slug.util';
import { Property } from '../entities/property.entity';
import { CreatePropertyDto } from 'libs/shared/dto/property/create-property.dto';
import { UpdatePropertyDto } from 'libs/shared/dto/property/update-property.dto';
import { PropertyRepository } from '../../infrastructure/repository/property.repository';

@Injectable()
export class PropertyService {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  create(
    dbName: string,
    input: CreatePropertyDto,
    organizationId: string,
    createdBy?: string,
  ): Observable<Property> {
    return from(
      (async () => {
        const slug = await this.uniqueSlug(dbName, input.name);
        return this.propertyRepository.create(
          dbName,
          { ...input, slug, organizationId },
          createdBy,
        );
      })(),
    );
  }

  findAll(dbName: string): Observable<Property[]> {
    return from(this.propertyRepository.findAll(dbName));
  }

  findById(dbName: string, id: string): Observable<Property | null> {
    return from(this.propertyRepository.findById(dbName, id));
  }

  findByIdOrSlug(dbName: string, idOrSlug: string): Observable<Property> {
    return from(
      (async () => {
        const property = await this.propertyRepository.findByIdOrSlug(
          dbName,
          idOrSlug,
        );
        if (!property) throw new RpcException('property_not_found');
        return property;
      })(),
    );
  }

  /** Renaming regenerates the slug so detail URLs always match the name. */
  update(
    dbName: string,
    idOrSlug: string,
    changes: UpdatePropertyDto,
  ): Observable<Property> {
    return from(
      (async () => {
        const existing = await this.propertyRepository.findByIdOrSlug(
          dbName,
          idOrSlug,
        );
        if (!existing) throw new RpcException('property_not_found');

        const update: Record<string, unknown> = { ...changes };
        if (changes.name && changes.name !== existing.name) {
          update.slug = await this.uniqueSlug(
            dbName,
            changes.name,
            String(existing._id),
          );
        }

        const updated = await this.propertyRepository.update(
          dbName,
          String(existing._id),
          update,
        );
        if (!updated) throw new RpcException('property_not_found');
        return updated;
      })(),
    );
  }

  delete(dbName: string, idOrSlug: string): Observable<{ deleted: boolean }> {
    return from(
      (async () => {
        const existing = await this.propertyRepository.findByIdOrSlug(
          dbName,
          idOrSlug,
        );
        if (!existing) throw new RpcException('property_not_found');
        const deleted = await this.propertyRepository.delete(
          dbName,
          String(existing._id),
        );
        return { deleted };
      })(),
    );
  }

  /**
   * Slug uniqueness is per tenant database (= per organization). Collisions
   * get a numeric suffix: `sunset-apartments`, `sunset-apartments-2`, …
   */
  private async uniqueSlug(
    dbName: string,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugify(name) || 'property';
    let candidate = base;
    let suffix = 2;
    while (
      await this.propertyRepository.slugExists(dbName, candidate, excludeId)
    ) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
