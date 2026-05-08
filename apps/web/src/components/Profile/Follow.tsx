// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useState } from 'react';
import Loading from 'react-loading';
import useUser from '@src/hooks/useUser';

import { ContentContainer, FollowContainer, TabSwitchContainer } from 'components/Profile/styled';
import UserList from 'components/UserList';
import { WideButton } from 'styles/Buttons';
import { Space } from 'styles/layout';

interface Props {
  profileUser: BigInt;
}

export default function Followers({ profileUser  }: Props) {
  const { user } = useUser();
  const [showFollowers, setShowFollowers] = useState<boolean>();
  //TODO: Create Followers Endpoint

  function handleButtonPress(followButton: boolean) {
    setShowFollowers(followButton);
  }

  if (user?.followers === undefined || user?.following === undefined) return (
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
        {/* FIXME type issue */}
        {/* @ts-expect-error */}
        <UserList users={showFollowers ? user.followers : user.following} />
      </FollowContainer>
    </ContentContainer>
  );
}


