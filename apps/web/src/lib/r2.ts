// Cloudflare R2 client. Server-side only.
//
// R2 is S3-compatible, so we use the AWS SDK pointed at R2's
// endpoint. Two operations matter for our flow:
//   - createPresignedUploadUrl: hands the browser a short-lived PUT
//     URL so it uploads directly to R2 (no proxy through this
//     server, no Next.js function payload limit).
//   - publicUrl: builds the read URL for a stored path. R2 buckets
//     can be exposed via a public r2.dev URL (default) or a custom
//     domain — both work; we just store the origin in
//     R2_PUBLIC_URL.
//
// Required env (set in Railway):
//   R2_ACCOUNT_ID         Cloudflare account id
//   R2_ACCESS_KEY_ID      R2 API token id
//   R2_SECRET_ACCESS_KEY  R2 API token secret
//   R2_BUCKET             Bucket name (e.g. "backspace-media")
//   R2_PUBLIC_URL         Read origin (e.g. "https://media.backspace.to"
//                         or "https://pub-<hash>.r2.dev")

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let cachedClient: S3Client | null = null;

function client(): S3Client {
  if (cachedClient) return cachedClient;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

export function r2Bucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error('R2_BUCKET not configured');
  return bucket;
}

export function r2PublicOrigin(): string {
  const origin = process.env.R2_PUBLIC_URL;
  if (!origin) throw new Error('R2_PUBLIC_URL not configured');
  return origin.replace(/\/$/, '');
}

export async function createPresignedUploadUrl(
  path: string,
  contentType: string,
  expiresInSeconds: number = 60 * 5,
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: r2Bucket(),
    Key: path,
    ContentType: contentType,
  });
  return getSignedUrl(client(), cmd, { expiresIn: expiresInSeconds });
}

export function r2PublicUrl(path: string): string {
  return `${r2PublicOrigin()}/${path.replace(/^\//, '')}`;
}
