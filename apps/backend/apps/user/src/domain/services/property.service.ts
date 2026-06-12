import { from, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { MediaOwnerTypes } from 'apps/constants';
import { slugify } from 'libs/shared/utils/slug.util';
import { Property } from '../entities/property.entity';
import { MediaAsset } from '../entities/media-asset.entity';
import { CreatePropertyDto } from 'libs/shared/dto/property/create-property.dto';
import { UpdatePropertyDto } from 'libs/shared/dto/property/update-property.dto';
import { PropertyRepository } from '../../infrastructure/repository/property.repository';
import { ContractRepository } from '../../infrastructure/repository/contract.repository';
import { MediaAssetRepository } from '../../infrastructure/repository/media-asset.repository';
import { PropertyTenantRepository } from '../../infrastructure/repository/property-tenant.repository';

/** Property reads are enriched with their media so the gateway needs one RPC. */
export interface PropertyWithMedia extends Property {
  coverImage?: MediaAsset | null;
  images?: MediaAsset[];
  documents?: MediaAsset[];
}

@Injectable()
export class PropertyService {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly mediaRepository: MediaAssetRepository,
    private readonly contractRepository: ContractRepository,
    private readonly propertyTenantRepository: PropertyTenantRepository,
  ) {}

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

  /** Lists carry each property's cover image for the card grid. */
  findAll(dbName: string): Observable<PropertyWithMedia[]> {
    return from(
      (async () => {
        const properties = await this.propertyRepository.findAll(dbName);
        const covers = await this.mediaRepository.findCoversForOwners(
          dbName,
          MediaOwnerTypes.PROPERTY,
          properties.map((property) => String(property._id)),
        );
        return properties.map((property) => ({
          ...property,
          coverImage: covers.get(String(property._id)) ?? null,
        }));
      })(),
    );
  }

  findById(dbName: string, id: string): Observable<Property | null> {
    return from(this.propertyRepository.findById(dbName, id));
  }

  /** Authoritative property count (plan-limit enforcement). */
  count(dbName: string): Observable<number> {
    return from(this.propertyRepository.count(dbName));
  }

  /** Details carry the full gallery + documents for the detail page. */
  findByIdOrSlug(dbName: string, idOrSlug: string): Observable<PropertyWithMedia> {
    return from(
      (async () => {
        const property = await this.propertyRepository.findByIdOrSlug(
          dbName,
          idOrSlug,
        );
        if (!property) throw new RpcException('property_not_found');

        const media = await this.mediaRepository.findByOwner(
          dbName,
          MediaOwnerTypes.PROPERTY,
          String(property._id),
        );
        const images = media.filter((asset) => asset.kind === 'image');
        return {
          ...property,
          images,
          documents: media.filter((asset) => asset.kind === 'document'),
          coverImage: images.find((asset) => asset.isCover) ?? images[0] ?? null,
        };
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

  /**
   * Deleting a property cascades: its contracts (and their media metadata)
   * are removed and tenants are unlinked (their records survive). All
   * orphaned storage keys are returned so the gateway (which owns the bucket)
   * can purge the actual objects.
   */
  delete(
    dbName: string,
    idOrSlug: string,
  ): Observable<{ deleted: boolean; mediaKeys: string[] }> {
    return from(
      (async () => {
        const existing = await this.propertyRepository.findByIdOrSlug(
          dbName,
          idOrSlug,
        );
        if (!existing) throw new RpcException('property_not_found');
        const propertyId = String(existing._id);

        const removedMedia = await this.mediaRepository.deleteByOwner(
          dbName,
          MediaOwnerTypes.PROPERTY,
          propertyId,
        );

        const contracts = await this.contractRepository.deleteByProperty(
          dbName,
          propertyId,
        );
        const contractMedia = await Promise.all(
          contracts.map((contract) =>
            this.mediaRepository.deleteByOwner(
              dbName,
              MediaOwnerTypes.CONTRACT,
              String(contract._id),
            ),
          ),
        );

        await this.propertyTenantRepository.detachAllFromProperty(
          dbName,
          propertyId,
        );

        const deleted = await this.propertyRepository.delete(
          dbName,
          propertyId,
        );
        return {
          deleted,
          mediaKeys: [...removedMedia, ...contractMedia.flat()].map(
            (asset) => asset.storageKey,
          ),
        };
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
