import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { loadStorageConfig } from './storage.config';
import { StorageProvider, StorageProviders } from './storage.types';
import { S3StorageProvider } from './providers/s3.storage.provider';
import { MinioStorageProvider } from './providers/minio.storage.provider';
import { StorageService, STORAGE_CONFIG } from './storage.service';

/**
 * Provider selection is configuration, not code: STORAGE_PROVIDER=s3 | minio.
 * Global so any feature module (properties, organizations, future uploads)
 * can inject StorageService without re-importing.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_CONFIG,
      inject: [ConfigService],
      useFactory: loadStorageConfig,
    },
    {
      provide: StorageProvider,
      inject: [STORAGE_CONFIG],
      useFactory: (config) =>
        config.provider === StorageProviders.S3
          ? new S3StorageProvider(config)
          : new MinioStorageProvider(config),
    },
    {
      provide: StorageService,
      inject: [StorageProvider, STORAGE_CONFIG],
      useFactory: (provider, config) => new StorageService(provider, config),
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
