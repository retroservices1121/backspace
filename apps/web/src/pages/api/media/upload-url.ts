// POST /api/media/upload-url
//
// Returns a short-lived presigned PUT URL the browser can upload to
// directly. Keeps file bytes off this Next.js function entirely —
// Vercel/Railway request limits don't matter, the upload streams
// straight to R2.
//
// Request body:
//   {
//     type: MediaUse                  // AVATAR | BANNER | POST | ...
//     id: string                      // owning entity id (user, post, ...)
//     fileName: string                // used for extension only
//     contentType: string             // image/jpeg, video/mp4, ...
//   }
//
// Response:
//   {
//     uploadUrl: string               // PUT this with the file body
//     path: string                    // store this on Media.path
//     host: 'R2'                      // matches StorageLocation
//     expiresIn: number               // seconds
//   }

import { MediaUse, StorageLocation } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { createPresignedUploadUrl } from '@src/lib/r2';
import { getFileExtension } from '@src/utils/common_utils';
import HttpStatus from 'http-status-codes';

const EXPIRES_IN = 60 * 5;

// Path layout for R2. Mirrors what lib/media.ts does for Firebase
// (so any future cross-bucket migration script can find paths in
// a predictable shape) but the bucket no longer matters as a path
// prefix because R2 buckets are flat — the type-derived prefix is
// just for human navigation in the dashboard.
function buildPath(type: MediaUse, id: string, fileName: string): string {
  const ext = getFileExtension(fileName);
  switch (type) {
    case MediaUse.AVATAR:
      return `avatars/user/${id}.${ext}`;
    case MediaUse.BANNER:
      return `banners/user/${id}.${ext}`;
    case MediaUse.COMMUNITY_AVATAR:
      return `avatars/community/${id}.${ext}`;
    case MediaUse.COMMUNITY_BANNER:
      return `banners/community/${id}.${ext}`;
    case MediaUse.MESSAGE:
      return `messages/${id}/${uuidv4()}.${ext}`;
    case MediaUse.POST:
      return `posts/${id}/${uuidv4()}.${ext}`;
    default:
      throw new Error(`Unsupported MediaUse: ${type}`);
  }
}

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .post(async (req, res) => {
    // useCache: false — getUserByAuthId is module-memoized, and a
    // just-onboarded user's authId may still be cached as `null` from
    // the pre-signup /api/user lookup. An auth check must read fresh.
    const user = await getUserByAuthId(req.authId, false);
    if (!user) {
      res.status(HttpStatus.UNAUTHORIZED).end('Not authorized');
      return;
    }

    const body = (req.body ?? {}) as {
      type?: MediaUse;
      id?: string;
      fileName?: string;
      contentType?: string;
    };
    if (!body.type || !body.id || !body.fileName || !body.contentType) {
      res.status(HttpStatus.BAD_REQUEST).end('type, id, fileName, contentType required');
      return;
    }

    let path: string;
    try {
      path = buildPath(body.type, body.id, body.fileName);
    } catch (err) {
      res.status(HttpStatus.BAD_REQUEST).end(
        err instanceof Error ? err.message : 'Invalid type',
      );
      return;
    }

    try {
      const uploadUrl = await createPresignedUploadUrl(path, body.contentType, EXPIRES_IN);
      res.json({
        uploadUrl,
        path,
        host: StorageLocation.R2,
        expiresIn: EXPIRES_IN,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('R2 presign failed', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end(
        err instanceof Error ? err.message : 'Failed to sign upload URL',
      );
    }
  });

export default handler;
