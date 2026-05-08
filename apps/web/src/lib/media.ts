// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History
//
// Client-side media upload helper. Post-pivot, all new uploads go
// to Cloudflare R2 via a server-issued presigned PUT URL. The
// Firebase / Supabase legacy paths were ripped out — Media rows
// already in those backends still resolve via api2/storage.ts on
// read, but new writes always land in R2.

import { toast } from 'react-toastify';
import { MediaUse, Prisma, StorageLocation } from '@prisma/client';
import axios from '@src/lib/axios';
import logEvent, { EventMessages } from '@src/lib/events';
import { getFileExtension } from '@src/utils/common_utils';
import { MAX_BYTES, MAX_POST_BYTES } from '@src/utils/constants';

export enum StorageBucket {
  ERROR = 'errors',

  AVATAR = 'avatars',
  BANNER = 'banners',
  DIRECT = 'directs',
  MESSAGE = 'messages',
  POST = 'posts',
}

// Default storage backend for new uploads. All new Media rows are
// written with host=R2; legacy rows on FIREBASE/SUPABASE keep
// resolving correctly on read.
const DEFAULT_HOST: StorageLocation = StorageLocation.R2;

export const mediaStorage = (type: MediaUse) => {
  let bucket: StorageBucket = StorageBucket.ERROR;
  let maxUploadSize = MAX_BYTES;
  const host: StorageLocation = DEFAULT_HOST;
  switch (type) {
    case MediaUse.AVATAR:
    case MediaUse.COMMUNITY_AVATAR:
      bucket = StorageBucket.AVATAR;
      maxUploadSize = MAX_BYTES;
      break;
    case MediaUse.BANNER:
    case MediaUse.COMMUNITY_BANNER:
      bucket = StorageBucket.BANNER;
      maxUploadSize = MAX_BYTES;
      break;
    case MediaUse.MESSAGE:
      bucket = StorageBucket.MESSAGE;
      maxUploadSize = MAX_BYTES;
      break;
    case MediaUse.POST:
      bucket = StorageBucket.POST;
      maxUploadSize = MAX_POST_BYTES;
      break;
    default:
      throw new Error(`${type} is not a valid MediaStorage Type`);
  }

  function getMediaRecord(storagePath: string, file: File | string) {
    const createMedia: Prisma.MediaCreateInput = {
      type,
      host,
      path: storagePath,
      fileExtension: getFileExtension(file),
    };
    return createMedia;
  }

  // Two-step upload:
  //   1. Ask /api/media/upload-url for a presigned R2 PUT URL.
  //   2. PUT the file straight at R2.
  // The Media row is written separately by the caller (POST /api/media
  // or PUT /api/media?relationId=...) once the upload succeeds, using
  // the path returned here. Server owns the path layout — clients no
  // longer pre-compute it.
  async function uploadFile(
    file: File,
    ownerId: string,
  ): Promise<{ ok: boolean; path: string }> {
    logEvent(EventMessages.Media.MediaUpload, { size: file.size, type: file.type });
    if (file.size > maxUploadSize) {
      console.error('File is too large to upload');
      toast.error('File is too large to upload');
      return { ok: false, path: '' };
    }

    try {
      const { data } = await axios().post('/media/upload-url', {
        type,
        id: ownerId,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
      });
      const uploadUrl: string = data.uploadUrl;
      const r2Path: string = data.path;

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });
      if (!putRes.ok) {
        const text = await putRes.text().catch(() => '');
        throw new Error(`R2 upload ${putRes.status}: ${text}`);
      }

      return { ok: true, path: r2Path };
    } catch (e) {
      console.error(e);
      toast.error('Media failed to upload');
      return { ok: false, path: '' };
    }
  }

  return {
    type,
    host,
    bucket,
    maxUploadSize,
    getMediaRecord,
    uploadFile,
  };
};
