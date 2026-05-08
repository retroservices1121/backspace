// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';

import { getMemoizedMedia } from 'api/communityAPI';
import { paths } from 'api/firebase';

// THIS HOOK IS A MONKEYPATCH TO A PROBLEM THAT IS GOING TO BE REFACTORED SHORTLY
// ASK BEFORE USING THIS. -unfortunately, sam
//
// 2026-05-08 cleanup note: this is one of the surviving Firebase-Storage
// readers (Bucket B). Communities still serve avatars/banners out of the
// legacy Firebase Storage bucket; the Postgres Community model has
// avatar/banner Media relations that should drive this flow once the R2
// migration lands. Replace this hook with a Prisma-backed lookup
// (community.avatar.path → api2/storage.pathToURL) at that time.
export function useCommunityMedia(id: string) {
  const [banner, setBanner] = useState('');
  const [profile, setProfile] = useState('');

  useEffect(() => {
    if (id) {
      getMemoizedMedia(paths.communityCover(id))
        .then(url => setBanner(url || ''));
      getMemoizedMedia(paths.communityProfile(id))
        .then(url => setProfile(url || ''));
    }
  }, [id]);

  return {
    banner, profile,
  };
}
