/**
 * Provider-agnostic storage contracts. Business code (controllers, services)
 * depends on these types only — never on the AWS SDK — so swapping providers
 * (S3 in production, MinIO locally) is a pure configuration change.
 */

export const StorageProviders = {
  S3: 's3',
  MINIO: 'minio',
} as const;

export type StorageProviderName =
  (typeof StorageProviders)[keyof typeof StorageProviders];

/** How object URLs are exposed to clients. */
export const StorageUrlModes = {
  /** Time-limited presigned GET URLs (private buckets — production default). */
  SIGNED: 'signed',
  /** Plain `<endpoint>/<bucket>/<key>` URLs (public-read buckets — local dev). */
  PUBLIC: 'public',
} as const;

export type StorageUrlMode =
  (typeof StorageUrlModes)[keyof typeof StorageUrlModes];

export interface StorageConfig {
  provider: StorageProviderName;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Service-reachable endpoint (MinIO only; S3 derives its own). */
  endpoint?: string;
  /**
   * Browser-reachable endpoint used when generating URLs. Needed when the
   * service talks to MinIO over the Docker network (`http://minio:9000`) but
   * the browser must use the host mapping (`http://localhost:9000`).
   */
  publicEndpoint?: string;
  forcePathStyle: boolean;
  urlMode: StorageUrlMode;
  signedUrlTtlSeconds: number;
}

export interface UploadObjectParams {
  key: string;
  body: Buffer;
  contentType: string;
  /** Original filename, kept as object metadata for audits/debugging. */
  originalName?: string;
  /** `attachment; filename="..."` to force download on documents. */
  contentDisposition?: string;
  cacheControl?: string;
}

export interface SignedUrlOptions {
  expiresInSeconds?: number;
  /** Override the response Content-Disposition (e.g. force a download name). */
  responseContentDisposition?: string;
}

/**
 * Contract every storage backend implements. Methods throw
 * {@link StorageOperationException} on failure so callers can map errors
 * uniformly.
 */
export abstract class StorageProvider {
  abstract upload(params: UploadObjectParams): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract deleteMany(keys: string[]): Promise<void>;
  abstract getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
  abstract getPublicUrl(key: string): string;
}

/** Uniform error wrapper so RPC/HTTP layers can map storage failures. */
export class StorageOperationException extends Error {
  constructor(
    public readonly operation: 'upload' | 'delete' | 'sign',
    public readonly key: string,
    cause?: unknown,
  ) {
    super(
      `storage_${operation}_failed: ${key}` +
        (cause instanceof Error ? ` (${cause.message})` : ''),
    );
    this.name = 'StorageOperationException';
  }
}
