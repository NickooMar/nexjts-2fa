import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Injectable, Inject } from '@nestjs/common';
import { MediaKind, sanitizeFilename } from './file-validation';
import {
  StorageConfig,
  StorageProvider,
  StorageUrlModes,
  SignedUrlOptions,
  UploadObjectParams,
} from './storage.types';

export const STORAGE_CONFIG = 'STORAGE_CONFIG';

export interface BuildKeyParams {
  /** Tenant id (or `control-plane` for shared entities like organizations). */
  tenantSegment: string;
  /** Entity that owns the file: `properties`, `organizations`, `users`, … */
  ownerType: string;
  ownerId: string;
  kind: MediaKind;
  originalName: string;
}

/**
 * Facade business code talks to. Owns key generation and URL policy; defers
 * the raw byte operations to the configured provider (S3 or MinIO).
 */
@Injectable()
export class StorageService {
  constructor(
    private readonly provider: StorageProvider,
    @Inject(STORAGE_CONFIG) private readonly config: StorageConfig,
  ) {}

  /**
   * Object keys are namespaced by tenant → owner → kind and always end in a
   * random UUID, so user-supplied filenames never influence bucket paths:
   * `tenants/<tenantId>/properties/<propertyId>/image/<uuid>.jpg`
   */
  buildKey(params: BuildKeyParams): string {
    const extension = extname(params.originalName ?? '').toLowerCase();
    return [
      'tenants',
      params.tenantSegment,
      params.ownerType,
      params.ownerId,
      params.kind,
      `${randomUUID()}${extension}`,
    ].join('/');
  }

  async upload(params: UploadObjectParams): Promise<void> {
    await this.provider.upload({
      cacheControl: 'private, max-age=31536000, immutable',
      ...params,
      originalName: params.originalName
        ? sanitizeFilename(params.originalName)
        : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    await this.provider.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    await this.provider.deleteMany(keys);
  }

  /**
   * Resolve a storage key to a URL the browser can load, honoring the
   * configured mode: presigned GET (private buckets) or plain public URL.
   */
  async resolveUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    if (this.config.urlMode === StorageUrlModes.PUBLIC) {
      return this.provider.getPublicUrl(key);
    }
    return this.provider.getSignedUrl(key, options);
  }

  /** Download URL that forces `attachment` with the original filename. */
  async resolveDownloadUrl(key: string, filename: string): Promise<string> {
    const safeName = sanitizeFilename(filename);
    if (this.config.urlMode === StorageUrlModes.PUBLIC) {
      // Public buckets can't override Content-Disposition per request.
      return this.provider.getPublicUrl(key);
    }
    return this.provider.getSignedUrl(key, {
      responseContentDisposition: `attachment; filename="${encodeURIComponent(safeName)}"`,
    });
  }

  get signedUrlTtlSeconds(): number {
    return this.config.signedUrlTtlSeconds;
  }
}
