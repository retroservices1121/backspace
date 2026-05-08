// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useState } from 'react';
import Loading from 'react-loading';

import { getAllFollowedUsers, getAllFollowingUsers } from 'api/userAPI';
import UserList from 'components/UserList';
import useAsyncEffect from 'hooks/useAsyncHook';
import { User } from 'store/userSlice';
import { WideButton } from 'styles/Buttons';
import { Space } from 'styles/layout';

import { ContentContainer, FollowContainer, TabSwitchContainer } from './../styled';

interface Props {
  profileUser: User;
}

export default function Followers({ profileUser  }: Props) {
  const [following, setFollowing] = useState<User[]>();
  const [followers, setFollowers] = useState<User[]>();
  const [showFollowers, setShowFollowers] = useState(true);

  useAsyncEffect([profileUser.id], async () => {
    const followerList = await getAllFollowingUsers(profileUser.id);
    const followingList = await getAllFollowedUsers(profileUser.id);
    setFollowing(followingList);
    setFollowers(followerList);
  });


  function handleButtonPress(followButton: boolean) {
    setShowFollowers(followButton);
  }

  if (followers === undefined || following === undefined) return (
    <ContentContainer>
      <Loading type='spinningBubbles' height={0} width={50} />
    </ContentContainer>
  );
  return (
    <ContentContainer>
      <FollowContainer>
        <TabSwitchContainer>
          <WideButton
            color={showFollowers ? 'primary' : 'backgroundMedium'}
            onClick={() => {handleButtonPress(true);}}
          >
            Followers
          </WideButton>
          <Space size="sm" />
          <WideButton
            color={!showFollowers ? 'primary' : 'backgroundMedium'}
            onClick={() => {handleButtonPress(false);}}
          >
            Following
          </WideButton>
        </TabSwitchContainer>
        <UserList users={showFollowers ? followers : following} />
      </FollowContainer>
    </ContentContainer>
  );
}


