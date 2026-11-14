import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import { type CreateAvatarMediaBody, type CreateUploadUrlBody, MEDIA_HOST, uploadUrlResponseSchema, type UploadUrlResponse } from '../schemas/media';

/**
 * POST /media/upload-url: asks the server for a presigned R2 PUT URL. The caller must already have a
 * User row (the route looks the caller up by auth id). Never log the returned `uploadUrl`.
 */
export function createUploadUrl(client: ApiClient, body: CreateUploadUrlBody): Promise<UploadUrlResponse> {
  return client.request('/media/upload-url', { method: 'POST', body, schema: uploadUrlResponseSchema });
}

/**
 * POST /media: writes the Media row. The route answers 200 with an empty body when Prisma rejects the
 * row, so anything other than a JSON object is treated as a failure.
 */
export async function createAvatarMedia(client: ApiClient, body: CreateAvatarMediaBody): Promise<void> {
  const media = await client.request('/media', { method: 'POST', body });
  if (typeof media !== 'object' || media === null) throw new ApiError(500, 'Your profile photo could not be saved.', 'media_not_created');
}

/** Same as web `defaultAvatar()` (apps/web/src/utils/constants.ts): `default/user/<1..16>.png`. */
export function defaultAvatarPath(random: () => number = Math.random): string {
  return `default/user/${Math.floor(random() * 16) + 1}.png`;
}

/** POST /media for one of the stock default avatars (no bytes uploaded). */
export function createDefaultAvatarMedia(client: ApiClient, authId: string): Promise<void> {
  return createAvatarMedia(client, { type: 'AVATAR', host: MEDIA_HOST, path: defaultAvatarPath(), fileExtension: 'PNG', avatarUser: { connect: { authId } } });
}
