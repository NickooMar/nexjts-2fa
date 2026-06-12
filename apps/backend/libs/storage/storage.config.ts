import { ConfigService } from '@nestjs/config';
import {
  StorageConfig,
  StorageProviders,
  StorageUrlModes,
  StorageUrlMode,
  StorageProviderName,
} from './storage.types';

/**
 * Resolve storage configuration from the environment. Defaults target the
 * docker-compose MinIO instance so local development works out of the box;
 * production deployments override with STORAGE_PROVIDER=s3 + IAM credentials.
 *
 * Validation of allowed values lives in apps/env.validation.ts; this only
 * shapes the already-validated values.
 */
export function loadStorageConfig(config: ConfigService): StorageConfig {
  const provider = config.get<StorageProviderName>(
    'STORAGE_PROVIDER',
    StorageProviders.MINIO,
  );
  const isMinio = provider === StorageProviders.MINIO;

  return {
    provider,
    bucket: config.get<string>('STORAGE_BUCKET', 'property-manager-media'),
    region: config.get<string>('STORAGE_REGION', 'us-east-1'),
    accessKeyId: config.get<string>(
      'STORAGE_ACCESS_KEY_ID',
      isMinio ? 'minioadmin' : '',
    ),
    secretAccessKey: config.get<string>(
      'STORAGE_SECRET_ACCESS_KEY',
      isMinio ? 'minioadmin' : '',
    ),
    endpoint: config.get<string>(
      'STORAGE_ENDPOINT',
      isMinio ? 'http://localhost:9000' : undefined,
    ),
    publicEndpoint: config.get<string>('STORAGE_PUBLIC_ENDPOINT') || undefined,
    // S3 supports virtual-hosted style; MinIO requires path-style.
    forcePathStyle:
      config.get<string>(
        'STORAGE_FORCE_PATH_STYLE',
        isMinio ? 'true' : 'false',
      ) === 'true',
    urlMode: config.get<StorageUrlMode>(
      'STORAGE_URL_MODE',
      StorageUrlModes.SIGNED,
    ),
    signedUrlTtlSeconds: Number(
      config.get<string>('STORAGE_SIGNED_URL_TTL_SECONDS', '900'),
    ),
  };
}
