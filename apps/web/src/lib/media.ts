// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { toast } from 'react-toastify';
import { MediaUse, Prisma, StorageLocation } from '@prisma/client';
import logEvent, { EventMessages } from '@src/lib/events';
import { getFileExtension } from '@src/utils/common_utils';
import { MAX_BYTES, MAX_POST_BYTES } from '@src/utils/constants';
import { storage } from '@src/utils/firebaseClient';
import { supabase } from '@src/utils/supabaseClient';
import { ref, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export enum StorageBucket {
  ERROR = 'errors', //Bucket that doesn't exist

  AVATAR = 'avatars',
  BANNER = 'banners',
  DIRECT = 'directs',
  MESSAGE = 'messages',
  POST = 'posts',
}

/**
 * Use this for doing all the media object translation based on type
 * NOTE: the reason this doesn't take the file at the top level is so you can upload several files back to back
 * @param type 
 * @returns 
 */
export const mediaStorage = (type: MediaUse) => {
  let bucket : StorageBucket = StorageBucket.ERROR;
  let maxUploadSize = MAX_BYTES; //In Bytes
  const host : StorageLocation = StorageLocation.FIREBASE; //Current upload location
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

  /**
   * 
   * @param id id of owning object (avatar: user ID, postMedia: post ID, etc.)
   * @param fileName file name of file being uploaded
   * @returns string of upload path based on bucket, id, and filename
   */
  function getPath(id: string, fileName: string) {
    const fileExtension = getFileExtension(fileName);
    switch (type) {
      case MediaUse.AVATAR: //user ID
        return `user/${id}.${fileExtension}`;
      case MediaUse.BANNER: // user ID
        return `user/${id}.${fileExtension}`;
      case MediaUse.MESSAGE: // conversation ID
        return `${id}/${uuidv4()}.${fileExtension}`;
      case MediaUse.POST: // post ID
        return `${id}/${uuidv4()}.${fileExtension}`;
      case MediaUse.COMMUNITY_AVATAR: 
        return `community/${id}/avatar`;
      case MediaUse.COMMUNITY_BANNER: 
        return `community/${id}/banner`;
      default:
        throw new Error('Unsupported MediaUse Type');
    }
  }

  function getMediaRecord(storagePath: string, file: File | string) {
    const createMedia : Prisma.MediaCreateInput = {
      type: type,
      host: host,
      path: storagePath,
      fileExtension: getFileExtension(file),
    };
    return createMedia;
  }

  /**
   * 
   * @param id id of owning object (avatar: user ID, postMedia: post ID, etc.)
   * @param file file to upload
   * @returns boolean indicating success or failure
   */
  async function uploadFile(storagePath: string, file: File): Promise<boolean> {
    logEvent(EventMessages.Media.MediaUpload, { size: file.size, type: file.type });
    if (file.size > maxUploadSize) {
      console.error('File is too large to upload');
      toast.error('File is too large to upload');
      return false;
    }
    let result : any = false;
    switch (host) {
      //@ts-ignore
      case StorageLocation.FIREBASE:
        result = await uploadBytes(ref(storage, storagePath), file).catch((e) => {
          console.error(e);
          toast.error('Media failed to upload');
          throw new Error('Issue Uploading Media');
        } );
        break;
      case StorageLocation.SUPABASE:
        result = await supabase
          .storage
          .from(bucket)
          .upload(storagePath, file, {
            upsert: true,
          })
          .then((r) => r.data)
          .catch((e) => {
            console.error(e);
            toast.error('Media failed to upload');
            throw new Error('Issue Uploading Media');
          } );
        break;
      default:
        break;
    }
  
    if (result) {
      console.log(`Uploaded Media: ${file.name}`);
      return true;
    } else {
      console.error('Failed to upload media');
      return false;
    }
  }

  return {
    type,
    host, 
    bucket,
    maxUploadSize,
    getMediaRecord,
    uploadFile,
    getPath,
  };
};
