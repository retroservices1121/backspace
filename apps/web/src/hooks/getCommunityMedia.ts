// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History
//
// Legacy community avatar/banner reader. Reads the pre-R2 Firebase
// Storage paths so existing communities keep rendering after the
// pivot. New uploads go through `pages/api/community/[id]` updates
// and `Community.avatar` / `Community.banner` Media relations; once
// every legacy community is re-uploaded (or migrated server-side)
// this hook can be replaced with a Postgres lookup of those Media
// rows.

import { useEffect, useState } from 'react';

import { legacyFirebasePathToURL } from '@src/api2/storage';

const COMMUNITIES_COLLECTION = 'communities';
const profilePath = (id: string) => `${COMMUNITIES_COLLECTION}/${id}/profilePic`;
const coverPath = (id: string) => `${COMMUNITIES_COLLECTION}/${id}/coverPic`;

export function useCommunityMedia(id: string) {
  const [banner, setBanner] = useState('');
  const [profile, setProfile] = useState('');

  useEffect(() => {
    if (!id) return;
    legacyFirebasePathToURL(coverPath(id)).then((url) => setBanner(url || ''));
    legacyFirebasePathToURL(profilePath(id)).then((url) => setProfile(url || ''));
  }, [id]);

  return { banner, profile };
}
