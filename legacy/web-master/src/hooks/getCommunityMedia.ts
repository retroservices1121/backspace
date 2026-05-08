// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';

import { getMemoizedMedia } from 'api/communityAPI';
import { paths } from 'api/firebase';

// THIS HOOK IS A MONKEYPATCH TO A PROBLEM THAT IS GOING TO BE REFACTORED SHORTLY
// ASK BEFORE USING THIS. -unfortunately, sam
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
