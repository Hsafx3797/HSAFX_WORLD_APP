/**
 * Cloudflare R2 Storage Service
 *
 * Provides upload, download, delete, and presigned URL operations
 * for temporary file storage in Cloudflare R2 (S3-compatible).
 *
 * @module @hsafx/shared/storage
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ── Config ──────────────────────────────────────────────────

interface StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}

function getConfig(): StorageConfig {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME ?? 'hsafx-uploads';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 storage not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.'
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl: process.env.R2_PUBLIC_URL,
  };
}

let _client: S3Client | undefined;

function getClient(): S3Client {
  if (!_client) {
    const config = getConfig();
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return _client;
}

// ── Types ───────────────────────────────────────────────────

export interface UploadOptions {
  /** S3 object key (path) */
  key: string;
  /** File content as Buffer or ReadableStream */
  body: Buffer | ReadableStream | Uint8Array;
  /** MIME type */
  contentType: string;
  /** Optional metadata */
  metadata?: Record<string, string>;
  /** TTL in seconds (sets cache-control) */
  ttlSeconds?: number;
}

export interface UploadResult {
  key: string;
  url: string;
  size?: number;
}

export interface PresignedUrlOptions {
  key: string;
  /** Expiry in seconds (default 3600 = 1 hour) */
  expiresIn?: number;
}

// ── Operations ──────────────────────────────────────────────

/**
 * Upload a file to R2.
 */
export async function upload(options: UploadOptions): Promise<UploadResult> {
  const config = getConfig();
  const client = getClient();

  const params: PutObjectCommandInput = {
    Bucket: config.bucketName,
    Key: options.key,
    Body: options.body as PutObjectCommandInput['Body'],
    ContentType: options.contentType,
    Metadata: options.metadata,
  };

  if (options.ttlSeconds) {
    params.CacheControl = `max-age=${options.ttlSeconds}`;
  }

  await client.send(new PutObjectCommand(params));

  const url = config.publicUrl
    ? `${config.publicUrl}/${options.key}`
    : `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${options.key}`;

  return { key: options.key, url };
}

/**
 * Get a presigned download URL for a file.
 */
export async function getDownloadUrl(options: PresignedUrlOptions): Promise<string> {
  const config = getConfig();
  const client = getClient();

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: options.key,
  });

  return getSignedUrl(client, command, {
    expiresIn: options.expiresIn ?? 3600,
  });
}

/**
 * Get a presigned upload URL for direct client upload.
 */
export async function getUploadUrl(
  options: PresignedUrlOptions & { contentType?: string }
): Promise<string> {
  const config = getConfig();
  const client = getClient();

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: options.key,
    ContentType: options.contentType,
  });

  return getSignedUrl(client, command, {
    expiresIn: options.expiresIn ?? 3600,
  });
}

/**
 * Delete a file from R2.
 */
export async function deleteFile(key: string): Promise<void> {
  const config = getConfig();
  const client = getClient();

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })
  );
}

/**
 * Delete multiple files by prefix (e.g., cleanup expired uploads).
 */
export async function deleteByPrefix(prefix: string): Promise<number> {
  const config = getConfig();
  const client = getClient();
  let deleted = 0;

  let continuationToken: string | undefined;
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key) {
          await client.send(
            new DeleteObjectCommand({
              Bucket: config.bucketName,
              Key: object.Key,
            })
          );
          deleted++;
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return deleted;
}

/**
 * List files with optional prefix filter.
 */
export async function listFiles(
  prefix?: string,
  maxKeys = 100
): Promise<Array<{ key: string; size: number; lastModified: Date | undefined }>> {
  const config = getConfig();
  const client = getClient();

  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    })
  );

  return (response.Contents ?? []).map((obj) => ({
    key: obj.Key ?? '',
    size: obj.Size ?? 0,
    lastModified: obj.LastModified,
  }));
}

/**
 * Generate a unique storage key for tool output files.
 */
export function generateStorageKey(
  userId: string,
  toolSlug: string,
  filename: string
): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const rand = Math.random().toString(36).slice(2, 8);
  return `outputs/${date}/${userId}/${toolSlug}/${rand}-${filename}`;
}
