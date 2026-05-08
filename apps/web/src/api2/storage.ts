// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Media, StorageLocation } from '@prisma/client';
import { mediaStorage, StorageBucket } from '@src/lib/media';
import { storage } from '@src/utils/firebaseClient';
import memoize from '@src/utils/memo';
import { supabase } from '@src/utils/supabaseClient';
import { getDownloadURL, ref } from 'firebase/storage';

const memoizedPathToURL = memoize(
  async (path: string, host: StorageLocation, bucket: StorageBucket = StorageBucket.ERROR): Promise<string> => {
    if (!path) return Promise.resolve('');
    switch (host) {
      case StorageLocation.FIREBASE:
        return getDownloadURL(ref(storage, path));
        break;
      case StorageLocation.SUPABASE:
        const { signedURL, error } = await supabase
          .storage
          .from(bucket)
          .createSignedUrl(path, 86400);
        return signedURL;   
      case StorageLocation.NONE:
        return Promise.resolve('');   
      default:
        console.error('Unsupported Media Hosting');
        return Promise.reject();
        break;
    }
  });

function pathToURL(path: string, host: StorageLocation, bucket: StorageBucket, useCache: boolean = true): Promise<string> {
  if (!useCache) { //Clear memoized user using arguments
    memoizedPathToURL.clear(path, host, bucket); 
  }
  
  return memoizedPathToURL(path, host, bucket);
}

export function mediaToURL(media: Media, useCache: boolean = true): Promise<string> {
  if (!media?.path || !media?.host) return Promise.resolve('');
  else {
    const ms = mediaStorage(media.type);
    const url = pathToURL(media.path, media.host, ms.bucket, useCache).catch((e) => {console.error(e); return '';});
    return url;
  }
}

export function mediaToURLCallback(media: Media, callback: (url: string) => any, useCache: boolean = true): void {
  if (!media?.path || !media?.host) callback('');
  else {
    const ms = mediaStorage(media.type);
    pathToURL(media.path, media.host, ms.bucket, useCache).then(url => callback(url)).catch((e) => console.error(e));
  }
  return;
}



