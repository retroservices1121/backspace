// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { Media, MediaUse } from '@prisma/client';
import { mediaStorage } from '@src/lib/media';

import { mediaToURLCallback } from 'api2/storage';


export default function useMedia(media: Media) {
  const [mediaUrl, setMediaUrl] = useState<string>(undefined);
  useEffect(() => {
    if (media) {
      mediaToURLCallback(media, setMediaUrl);
    }
  }, [media]);
  return mediaUrl as string;
}
