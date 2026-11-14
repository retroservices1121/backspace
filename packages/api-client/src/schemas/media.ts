import { z } from 'zod';

/** Largest avatar upload web accepts (apps/web/src/utils/constants.ts MAX_BYTES). */
export const MAX_AVATAR_BYTES = 10_000_000;

/** Storage host for every new upload (apps/web/src/lib/media.ts DEFAULT_HOST). */
export const MEDIA_HOST = 'R2';

/** Body of POST /api/media/upload-url (apps/web/src/pages/api/media/upload-url.ts). */
export interface CreateUploadUrlBody {
  type: 'AVATAR';
  /** Owning entity id; for avatars, the new User's uuid. */
  id: string;
  /** Only its extension is used, to build the storage path. */
  fileName: string;
  /** Must match the Content-Type of the later PUT. */
  contentType: string;
}

/** Response of POST /api/media/upload-url. `uploadUrl` is a short-lived presigned R2 PUT URL. */
export const uploadUrlResponseSchema = z
  .object({
    uploadUrl: z.string().min(1),
    path: z.string().min(1),
    host: z.string().optional(),
    expiresIn: z.number().optional(),
  })
  .loose();

export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;

/** Body of POST /api/media for an avatar, shaped like the web onboarding client (hooks/useOnboarding.ts). */
export interface CreateAvatarMediaBody {
  type: 'AVATAR';
  host: typeof MEDIA_HOST;
  path: string;
  fileExtension: string;
  avatarUser: { connect: { authId: string } };
}
