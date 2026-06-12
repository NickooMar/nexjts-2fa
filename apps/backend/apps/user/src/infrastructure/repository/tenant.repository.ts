import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { TENANT_DB_PREFIX } from 'apps/constants';
import { slugify } from 'libs/shared/utils/slug.util';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantDocument } from '../schemas/tenant.schema';
import { CreateTenantDto } from 'libs/shared/dto/tenant/create-tenant.dto';
import { BaseRepository } from 'libs/shared/repositories/base.repository';

@Injectable()
export class TenantRepository extends BaseRepository<TenantDocument> {
  constructor(
    @InjectModel('Tenant')
    protected readonly tenantModel: Model<TenantDocument>,
  ) {
    super(tenantModel);
  }

  async findById(id: string): Promise<Tenant | null> {
    const tenant = await super.findOne({ _id: new Types.ObjectId(id) });
    if (!tenant) return null;
    return new Tenant(tenant);
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await super.findOne({ slug });
    if (!tenant) return null;
    return new Tenant(tenant);
  }

  async create(input: CreateTenantDto): Promise<Tenant> {
    const slug = await this.generateUniqueSlug(input.name);
    const created = await super.create({
      name: input.name,
      slug,
      dbName: `${TENANT_DB_PREFIX}${slug}`,
      status: 'active',
      country: input.country,
      ownerId: input.ownerId ? new Types.ObjectId(input.ownerId) : undefined,
      ...(input.website && { website: input.website }),
      ...(input.phone && { phone: input.phone }),
    });
    return new Tenant(created);
  }

  /**
   * Swap the logo/banner storage key. Returns the updated tenant plus the
   * replaced key so the caller can purge the old object from the bucket.
   */
  async updateBranding(
    tenantId: string,
    field: 'logoKey' | 'bannerKey',
    storageKey: string | null,
  ): Promise<{ tenant: Tenant; previousKey?: string } | null> {
    if (!Types.ObjectId.isValid(tenantId)) return null;
    const previous = await this.tenantModel
      .findById(new Types.ObjectId(tenantId))
      .select(field)
      .lean();
    if (!previous) return null;

    const updated = await this.tenantModel
      .findByIdAndUpdate(
        new Types.ObjectId(tenantId),
        storageKey
          ? { $set: { [field]: storageKey } }
          : { $unset: { [field]: 1 } },
        { new: true },
      )
      .lean();
    if (!updated) return null;

    return {
      tenant: new Tenant(updated),
      previousKey: previous[field] ?? undefined,
    };
  }

  /**
   * Derive a slug from the organization name and guarantee uniqueness by
   * appending a short numeric suffix when a collision is found.
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'tenant';
    let candidate = base;
    let attempt = 0;

    // Bounded loop to avoid runaway collisions.
    while (attempt < 50) {
      const existing = await this.tenantModel.exists({ slug: candidate });
      if (!existing) return candidate;
      attempt += 1;
      candidate = `${base}-${attempt}`;
    }

    throw new RpcException('tenant_slug_generation_failed');
  }
}
