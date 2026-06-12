import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { Logger } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  StorageConfig,
  StorageProvider,
  SignedUrlOptions,
  UploadObjectParams,
  StorageOperationException,
} from '../storage.types';

/**
 * AWS S3 implementation. Also the base for the MinIO provider — both speak
 * the S3 API; they differ only in endpoints, addressing style and how
 * browser-facing URLs are built.
 */
export class S3StorageProvider extends StorageProvider {
  protected readonly logger = new Logger(this.constructor.name);

  /** Client used for uploads/deletes (service-reachable endpoint). */
  protected readonly client: S3Client;
  /** Client used to presign URLs the *browser* must be able to reach. */
  protected readonly signingClient: S3Client;

  constructor(protected readonly config: StorageConfig) {
    super();
    this.client = this.createClient(config.endpoint);
    this.signingClient =
      config.publicEndpoint && config.publicEndpoint !== config.endpoint
        ? this.createClient(config.publicEndpoint)
        : this.client;
  }

  private createClient(endpoint?: string): S3Client {
    return new S3Client({
      region: this.config.region,
      forcePathStyle: this.config.forcePathStyle,
      ...(endpoint ? { endpoint } : {}),
      ...(this.config.accessKeyId
        ? {
            credentials: {
              accessKeyId: this.config.accessKeyId,
              secretAccessKey: this.config.secretAccessKey,
            },
          }
        : {}), // no static keys → fall back to the IAM role / default chain
    });
  }

  async upload(params: UploadObjectParams): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: params.key,
          Body: params.body,
          ContentType: params.contentType,
          ContentDisposition: params.contentDisposition,
          CacheControl: params.cacheControl,
          Metadata: params.originalName
            ? { 'original-name': encodeURIComponent(params.originalName) }
            : undefined,
        }),
      );
    } catch (error) {
      this.logger.error(`Upload failed for "${params.key}"`, error as Error);
      throw new StorageOperationException('upload', params.key, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
      );
    } catch (error) {
      this.logger.error(`Delete failed for "${key}"`, error as Error);
      throw new StorageOperationException('delete', key, error);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.config.bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
        }),
      );
    } catch (error) {
      this.logger.error(
        `Bulk delete failed (${keys.length} keys)`,
        error as Error,
      );
      throw new StorageOperationException('delete', keys.join(','), error);
    }
  }

  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    try {
      return await getSignedUrl(
        this.signingClient,
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          ResponseContentDisposition: options?.responseContentDisposition,
        }),
        {
          expiresIn:
            options?.expiresInSeconds ?? this.config.signedUrlTtlSeconds,
        },
      );
    } catch (error) {
      throw new StorageOperationException('sign', key, error);
    }
  }

  getPublicUrl(key: string): string {
    const base = this.config.publicEndpoint ?? this.config.endpoint;
    if (base) {
      return `${base.replace(/\/$/, '')}/${this.config.bucket}/${key}`;
    }
    if (this.config.forcePathStyle) {
      return `https://s3.${this.config.region}.amazonaws.com/${this.config.bucket}/${key}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }
}
