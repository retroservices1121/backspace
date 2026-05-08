// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Community Navigation Icon (image or acronym)

import React, { useMemo, useState } from 'react';

import { ImageButton, ImageInButton, TooltipText, UnreadCount } from './styled';

function getAcronym(name: string = '') {
  if (name === '') return '';
  let acronym = name
    .split(/\s/)
    .reduce((response, word) => response += word.slice(0, 1), '')
    .slice(0, 3);
  if (acronym.length === 1) acronym = name.slice(0, 2); // If single word, display the first two characters
  return acronym.toLowerCase();
}

const Sizes  = {
  small: '48px',
  medium: '75px',
  large: '100px',
};

type Props = {
  communityName: string;
  size?: keyof typeof Sizes;
  active?: boolean;
  onClick: () => void;
  image?: string;
};

const CommunityIcon: React.FC<Props> = ({
  communityName,
  size = 'small',
  active = false,
  onClick,
  image = null,
}) => {
  const [unread, setUnread] = useState(0);

  const icon = useMemo(
    () => image ? <ImageInButton src={image} /> : getAcronym(communityName),
    [image],
  );

  // TODO unread icons
  // useEffect(() => {
  //   if (community && authId) {
  //     getCommunityUnread(authId, community).then((count : number) => setUnread(count));
  //   }
  // }, [community?.message_count, active]);

  // TODO mark as read
  // Set read if community becomes active
  // useEffect(() => {
  //   if (authId && communityId && active) {
  //     updateCommunityReadCount(authId, communityId);
  //     //Sync new read count
  //     getCommunityById(communityId).then((commun) => {
  //       if (commun) setCommunity(commun);
  //     });
  //   }
  // }, [active]);

  return (
    <ImageButton size={Sizes[size]} active={active} onClick={onClick}>
      {unread > 0 && <UnreadCount>{unread}</UnreadCount>}
      {onClick && <TooltipText>{communityName}</TooltipText>}
      {icon}
    </ImageButton>
  );
};

export default CommunityIcon;
