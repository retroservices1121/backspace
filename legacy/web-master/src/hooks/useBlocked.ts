// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from 'store/store';


export const useBlocked = (otherUser: string) => {
  const { blockedUsers } = useSelector((state: RootState) => state.network);
  const [blocked, setBlocked] = useState<boolean>(false);

  useEffect(() => {
    if (otherUser) {
      if (blockedUsers.get(otherUser) != blocked) {
        setBlocked(blockedUsers.get(otherUser) || false);
      }
    }
  }, [blockedUsers, otherUser]);

  return {
    blocked,
  };
};
