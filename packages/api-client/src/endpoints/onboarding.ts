import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import { MAX_AVATAR_BYTES, MEDIA_HOST } from '../schemas/media';
import type { CreatePrivateBody, CreateUserBody, CreateUserStateBody, SimpleDate } from '../schemas/onboarding';
import { selfResponseSchema, type User } from '../schemas/user';
import { createAvatarMedia, createDefaultAvatarMedia, createUploadUrl } from './media';

/**
 * POST /user: creates the Backspace User row. Server rejections surface as `ApiError` with the
 * server's `message`. A JSON `null` body means the row was not created.
 */
export async function createUser(client: ApiClient, body: CreateUserBody): Promise<User> {
  const user = await client.request('/user', { method: 'POST', body, schema: selfResponseSchema });
  if (!user) throw new ApiError(500, 'Your profile could not be created. Try again.', 'user_not_created');
  return user;
}

/** POST /private: private details (first/last name, email, optional date of birth). */
export function createPrivate(client: ApiClient, body: CreatePrivateBody): Promise<unknown> {
  return client.request('/private', { method: 'POST', body });
}

/** POST /userstate: marks the user as onboarded. */
export function createUserState(client: ApiClient, body: CreateUserStateBody): Promise<unknown> {
  return client.request('/userstate', { method: 'POST', body });
}

/**
 * A picked profile photo. The JSON calls stay in this package; the raw bytes are sent by `put`, which the
 * app implements (the presigned URL points at R2, not the Backspace API, and must not get the Bearer token).
 */
export interface AvatarUpload {
  /** Sent to POST /media/upload-url; only its extension is used for the storage path. */
  fileName: string;
  /** Signed into the upload URL; `put` must send exactly this Content-Type. */
  contentType: string;
  /** Stored on the Media row, like web `getFileExtension(file)`. */
  fileExtension: string;
  /** Size in bytes, when known before reading the file. */
  size?: number;
  /** PUTs the file bytes to `uploadUrl` with only `Content-Type: contentType`. Throws on failure. */
  put(uploadUrl: string, contentType: string): Promise<void>;
}

export interface CompleteOnboardingInput {
  /** Privy user id (DID). */
  authId: string;
  username: string;
  displayName: string;
  /** Freshly generated v4 UUID for the new User row; also the avatar owner id. */
  uuid: string;
  email?: string | null;
  /** Picked profile photo. Omitted or null → a random stock default avatar, like web. */
  avatar?: AvatarUpload | null;
  /** Optional date of birth; omitted from POST /private when null, like web. */
  dateOfBirth?: SimpleDate | null;
}

export type OnboardingFollowUp = 'media' | 'private' | 'userstate';

export interface CompleteOnboardingResult {
  user: User;
  /** True when a picked photo could not be uploaded or saved and the default avatar was used instead. */
  photoUploadFailed: boolean;
  /** Follow-up writes that failed after the User row was created. `'media'` means no avatar row at all. */
  failedFollowUps: OnboardingFollowUp[];
}

/** Splits a display name into first name (first token) and last name (the remainder, possibly empty). */
export function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

/** Upload-url → PUT → POST /media for a picked photo (apps/web/src/lib/media.ts uploadFile). */
async function uploadAvatar(client: ApiClient, avatar: AvatarUpload, ownerId: string, authId: string): Promise<void> {
  if (avatar.size !== undefined && avatar.size > MAX_AVATAR_BYTES) throw new ApiError(413, 'File is too large to upload.', 'file_too_large');
  const { uploadUrl, path } = await createUploadUrl(client, { type: 'AVATAR', id: ownerId, fileName: avatar.fileName, contentType: avatar.contentType });
  await avatar.put(uploadUrl, avatar.contentType);
  await createAvatarMedia(client, { type: 'AVATAR', host: MEDIA_HOST, path, fileExtension: avatar.fileExtension, avatarUser: { connect: { authId } } });
}

/**
 * Mirrors the web onboarding submit (apps/web/src/hooks/useOnboarding.ts): POST /user, then the avatar
 * Media row, then POST /private and POST /userstate in parallel.
 *
 * The avatar is attached before returning so the caller can wait for it before leaving onboarding.
 * Unlike web (which writes no Media row when an upload fails), a failed photo falls back to the stock
 * default avatar and sets `photoUploadFailed`.
 *
 * Once the User row exists the profile is usable, so every follow-up is best effort. Failures are
 * reported in `failedFollowUps` instead of thrown: retrying POST /user would only collide with the row
 * that was just created.
 */
export async function completeOnboarding(client: ApiClient, input: CompleteOnboardingInput): Promise<CompleteOnboardingResult> {
  const user = await createUser(client, { username: input.username, name: input.displayName, authId: input.authId, uuid: input.uuid });
  const failedFollowUps: OnboardingFollowUp[] = [];

  let photoUploadFailed = false;
  let hasAvatar = false;
  if (input.avatar) {
    try {
      await uploadAvatar(client, input.avatar, input.uuid, input.authId);
      hasAvatar = true;
    } catch {
      photoUploadFailed = true;
    }
  }
  if (!hasAvatar) {
    try {
      await createDefaultAvatarMedia(client, input.authId);
    } catch {
      failedFollowUps.push('media');
    }
  }

  const connect = { connect: { authId: input.authId } };
  const { firstName, lastName } = splitDisplayName(input.displayName);
  const dob = input.dateOfBirth;
  const [privateResult, stateResult] = await Promise.allSettled([
    createPrivate(client, {
      user: connect,
      firstName,
      lastName,
      ...(input.email ? { email: input.email } : {}),
      ...(dob ? { dobYear: dob.year, dobMonth: dob.month, dobDay: dob.day } : {}),
    }),
    createUserState(client, { user: connect, onboarded: true }),
  ]);
  if (privateResult.status === 'rejected') failedFollowUps.push('private');
  if (stateResult.status === 'rejected') failedFollowUps.push('userstate');
  return { user, photoUploadFailed, failedFollowUps };
}
