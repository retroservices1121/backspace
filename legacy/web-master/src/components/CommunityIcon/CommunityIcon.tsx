// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Community Navigation Icon (image or acronym)

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { CommunityUnion, getCommunityById, getCommunityUnread, updateCommunityReadCount } from 'api/communityAPI';
import { useCommunityMedia } from 'hooks/getCommunityMedia';
import { RootState } from 'store/store';

import { ImageButton, ImageInButton, TooltipText, UnreadCount } from './styled';

// Make an acronym from a string
export const getAcronym = (name : string = '') => {
  if (!name) return '';
  let acronym = name.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '').slice(0, 3);
  if (acronym.length === 1) acronym = name.slice(0, 2); // If single word, display the first two characters
  return acronym.toLowerCase();
};

const Sizes  = {
  small: '48px',
  medium: '75px',
  large: '100px',
};

type Props = {
  communityId: string;
  size?: keyof typeof Sizes;
  active?: boolean;
  handler?: () => void;
};

const CommunityIcon: React.FC<Props> = ({ communityId, size = 'small', active, handler }) => {
  const uid = useSelector((state : RootState) => state.user.id);
  const [community, setCommunity] = useState<CommunityUnion>();
  const [unread, setUnread] = useState(0);
  // TODO temp solution to community.image not working as expected
  const { profile } = useCommunityMedia(communityId);
  useEffect(() => {
    getCommunityById(communityId).then((commun) => {
      if (commun) {
        setCommunity(commun);
      }
    });
  }, [communityId]);

  useEffect(() => {
    if (community && uid) {
      getCommunityUnread(uid, community).then((count : number) => setUnread(count));
    }
  }, [community?.message_count, active]);


  // Set read if community becomes active
  useEffect(() => {
    if (uid && communityId && active) {
      updateCommunityReadCount(uid, communityId);
      //Sync new read count
      getCommunityById(communityId).then((commun) => {
        if (commun) setCommunity(commun);
      });
    }
  }, [active]);

  return (
    <ImageButton size={Sizes[size]} active={active} onClick={handler}>
      {unread > 0 && <UnreadCount>{unread}</UnreadCount>}
      {handler && <TooltipText>{community?.name}</TooltipText>}
      {profile ? <ImageInButton src={profile}/> : getAcronym(community?.name)}
    </ImageButton>
  );
};

export default CommunityIcon;
