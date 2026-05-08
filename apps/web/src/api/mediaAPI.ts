// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Abstraction Class for Media Operations

import { getDownloadURL, ref } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

import { DirectMessageDocument } from 'types/documents';
import { storage } from 'utils/firebase';

export async function getMediaUrl(storagePath : string) {
  if (!(storagePath && storagePath.length > 0)) {
    console.warn('storage path was empty');
    return '';
  }
  let result = await getDownloadURL(ref(storage, storagePath)).catch(() => {
    console.error('failed to fetch media');
    return '';
  });
  return result || '';
}

class MediaAPI {
  // Generic URL fetcher
  /** @deprecated */
  static async getDownloadURL(storagePath : string) {
    if (storagePath) {
      return getMediaUrl(storagePath);
    } else {
      return '';
    }
    
  }

  static getDirectMessageMediaPath(message : DirectMessageDocument, fileObj : File) {
    const uidArray = [message.recipient, message.sender];
    uidArray.sort();
    const imageDirectory = `${uidArray[0]}_${uidArray[1]}`;
    const randomPrefix = uuidv4();
    return `direct_message/${imageDirectory}/${randomPrefix}_${fileObj.name}`;
  }
}

export default MediaAPI;
