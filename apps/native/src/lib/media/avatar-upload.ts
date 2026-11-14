import { type AvatarUpload, MAX_AVATAR_BYTES } from '@backspace/api-client';
import type { ImagePickerAsset } from 'expo-image-picker';

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

function extensionOf(name: string | null | undefined): string | null {
  if (!name) return null;
  const base = name.split(/[?#]/)[0]?.split('/').pop() ?? '';
  const dot = base.lastIndexOf('.');
  return dot > 0 && dot < base.length - 1 ? base.slice(dot + 1) : null;
}

/** True when the picker already reports a size above web's 10 MB avatar limit. */
export function isAssetTooLarge(asset: ImagePickerAsset): boolean {
  return typeof asset.fileSize === 'number' && asset.fileSize > MAX_AVATAR_BYTES;
}

/**
 * PUTs bytes to a presigned R2 URL. Sends only `Content-Type` (it must match what was signed): no
 * Backspace Bearer token, and not through the API client, whose base URL is the Backspace API.
 * Never logs the URL, which grants write access until it expires.
 */
export async function putToPresignedUrl(url: string, body: Blob, contentType: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': contentType }, body });
  } catch {
    throw new Error('Photo upload failed.');
  }
  if (!response.ok) throw new Error(`Photo upload failed (${response.status}).`);
}

/**
 * Describes a picked photo for `completeOnboarding`. The file name and extension come from the local
 * file the picker produced (after cropping it may be a JPEG even if the original was HEIC), so the
 * storage path, Content-Type and bytes agree.
 */
export function toAvatarUpload(asset: ImagePickerAsset): AvatarUpload {
  const extension = extensionOf(asset.uri) ?? extensionOf(asset.fileName) ?? asset.mimeType?.split('/')[1] ?? 'jpg';
  const contentType = asset.mimeType || MIME_BY_EXTENSION[extension.toLowerCase()] || 'application/octet-stream';
  return {
    fileName: `avatar.${extension}`,
    contentType,
    fileExtension: extension,
    size: asset.fileSize,
    async put(uploadUrl, signedContentType) {
      // On web the picker hands back the File itself; on iOS/Android read the local file URI.
      const blob = asset.file ?? (await (await fetch(asset.uri)).blob());
      if (blob.size > MAX_AVATAR_BYTES) throw new Error('File is too large to upload.');
      await putToPresignedUrl(uploadUrl, blob, signedContentType);
    },
  };
}
