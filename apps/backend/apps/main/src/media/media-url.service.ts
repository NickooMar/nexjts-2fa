import { Injectable } from '@nestjs/common';
import { StorageService } from 'libs/storage/storage.service';

/** Media asset as stored by the user service (metadata + storage key). */
interface StoredMediaAsset {
  _id: string;
  uuid: string;
  kind: 'image' | 'document';
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  order: number;
  isCover: boolean;
  createdAt: string | Date;
}

/** Shape exposed to clients: the storage key is swapped for a usable URL. */
export interface ClientMediaAsset {
  _id: string;
  uuid: string;
  kind: 'image' | 'document';
  originalName: string;
  mimeType: string;
  size: number;
  order: number;
  isCover: boolean;
  url: string;
  createdAt: string | Date;
}

/**
 * Translates internal media records into client payloads. Storage keys never
 * leave the gateway — clients only ever see resolved URLs (presigned or
 * public, depending on STORAGE_URL_MODE).
 */
@Injectable()
export class MediaUrlService {
  constructor(private readonly storage: StorageService) {}

  async toClientAsset(
    asset: StoredMediaAsset | null | undefined,
  ): Promise<ClientMediaAsset | null> {
    if (!asset) return null;
    return {
      _id: String(asset._id),
      uuid: asset.uuid,
      kind: asset.kind,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      size: asset.size,
      order: asset.order,
      isCover: asset.isCover,
      url: await this.storage.resolveUrl(asset.storageKey),
      createdAt: asset.createdAt,
    };
  }

  async toClientAssets(
    assets: StoredMediaAsset[] | undefined,
  ): Promise<ClientMediaAsset[]> {
    return Promise.all(
      (assets ?? []).map((asset) => this.toClientAsset(asset)),
    ) as Promise<ClientMediaAsset[]>;
  }

  /** List payload: only the cover image is attached per property. */
  async enrichPropertyList(properties: any[]): Promise<any[]> {
    return Promise.all(
      (properties ?? []).map(async (property) => ({
        ...property,
        coverImage: await this.toClientAsset(property.coverImage),
      })),
    );
  }

  /** Detail payload: full gallery + documents. */
  async enrichPropertyDetail(property: any): Promise<any> {
    if (!property) return property;
    return {
      ...property,
      coverImage: await this.toClientAsset(property.coverImage),
      images: await this.toClientAssets(property.images),
      documents: await this.toClientAssets(property.documents),
    };
  }

  /** Contract payload: scanned images + documents. */
  async enrichContract(contract: any): Promise<any> {
    if (!contract) return contract;
    return {
      ...contract,
      images: await this.toClientAssets(contract.images),
      documents: await this.toClientAssets(contract.documents),
    };
  }

  async enrichContracts(contracts: any[]): Promise<any[]> {
    return Promise.all(
      (contracts ?? []).map((contract) => this.enrichContract(contract)),
    );
  }

  /** Tenant/organization payload: logo + banner keys → URLs. */
  async enrichTenantBranding(tenant: any): Promise<any> {
    if (!tenant) return tenant;
    const { logoKey, bannerKey, ...rest } = tenant;
    return {
      ...rest,
      logoUrl: logoKey ? await this.storage.resolveUrl(logoKey) : null,
      bannerUrl: bannerKey ? await this.storage.resolveUrl(bannerKey) : null,
    };
  }
}
