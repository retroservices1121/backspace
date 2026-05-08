// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History
//
// Resolves a Media row to a renderable URL. New uploads land in R2
// (host=R2) and resolve to a public/custom-domain URL with no
// network call. Legacy rows on FIREBASE/SUPABASE still resolve via
// the Firebase/Supabase SDKs for backwards compatibility — those
// branches are dead-code on write but kept on read until the legacy
// rows are migrated or evicted.

import { Media, StorageLocation } from '@prisma/client';
import { mediaStorage, StorageBucket } from '@src/lib/media';
import memoize from '@src/utils/memo';
import { supabase } from '@src/utils/supabaseClient';

const memoizedPathToURL = memoize(
  async (
    path: string,
    host: StorageLocation,
    bucket: StorageBucket = StorageBucket.ERROR,
  ): Promise<string> => {
    if (!path) return '';
    switch (host) {
      case StorageLocation.R2: {
        // Lazy-import to avoid bundling the AWS SDK unless we
        // actually have to compute an R2 URL on the client. The
        // public-URL helper itself is server-config dependent.
        const { r2PublicUrl } = await import('@src/lib/r2');
        return r2PublicUrl(path);
      }
      case StorageLocation.URL:
        return path;
      case StorageLocation.FIREBASE: {
        // Legacy: avatars/banners uploaded before R2 cutover. We
        // dynamically import firebase here so the legacy code path
        // doesn't pull Firebase into bundles that don't need it.
        const { storage } = await import('@src/utils/firebaseClient');
        const { getDownloadURL, ref } = await import('firebase/storage');
        return getDownloadURL(ref(storage, path));
      }
      case StorageLocation.SUPABASE: {
        const { signedURL } = await supabase
          .storage
          .from(bucket)
          .createSignedUrl(path, 86400);
        return signedURL ?? '';
      }
      case StorageLocation.NONE:
        return '';
      default:
        // eslint-disable-next-line no-console
        console.error('Unsupported Media Hosting', host);
        return '';
    }
  },
);

function pathToURL(
  path: string,
  host: StorageLocation,
  bucket: StorageBucket,
  useCache: boolean = true,
): Promise<string> {
  if (!useCache) {
    memoizedPathToURL.clear(path, host, bucket);
  }
  return memoizedPathToURL(path, host, bucket);
}

export function mediaToURL(media: Media, useCache: boolean = true): Promise<string> {
  if (!media?.path || !media?.host) return Promise.resolve('');
  const ms = mediaStorage(media.type);
  return pathToURL(media.path, media.host, ms.bucket, useCache).catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    return '';
  });
}

export function mediaToURLCallback(
  media: Media,
  callback: (url: string) => any,
  useCache: boolean = true,
): void {
  if (!media?.path || !media?.host) {
    callback('');
    return;
  }
  const ms = mediaStorage(media.type);
  pathToURL(media.path, media.host, ms.bucket, useCache)
    .then((url) => callback(url))
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
    });
}
