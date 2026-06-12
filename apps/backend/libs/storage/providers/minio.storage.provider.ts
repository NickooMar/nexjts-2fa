import { StorageConfig } from '../storage.types';
import { S3StorageProvider } from './s3.storage.provider';

/**
 * MinIO speaks the S3 wire protocol, so the implementation is the S3 provider
 * pinned to MinIO-correct settings:
 *
 * - a custom endpoint is mandatory (there is no AWS default to fall back to);
 * - path-style addressing is forced (`<endpoint>/<bucket>/<key>` — MinIO does
 *   not resolve virtual-hosted `<bucket>.<endpoint>` names);
 * - presigned URLs are signed against STORAGE_PUBLIC_ENDPOINT when set, so a
 *   gateway talking to `http://minio:9000` inside Docker still hands the
 *   browser a URL on `http://localhost:9000` with a valid signature.
 */
export class MinioStorageProvider extends S3StorageProvider {
  constructor(config: StorageConfig) {
    if (!config.endpoint) {
      throw new Error(
        'STORAGE_ENDPOINT is required when STORAGE_PROVIDER=minio',
      );
    }
    super({ ...config, forcePathStyle: true });
  }
}
