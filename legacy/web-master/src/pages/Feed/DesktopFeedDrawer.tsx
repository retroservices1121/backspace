// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSelector } from 'react-redux';

import Drawer from 'components/Drawer';
import UserTile from 'components/UserActionTile';
import { ReactComponent as DiscoverIcon } from 'graphics/commonicons/discover.svg';
import { ReactComponent as FollowIcon } from 'graphics/commonicons/heart.svg';
import { ReactComponent as CommunityIcon } from 'graphics/navigation/channel.svg';
import { RootState } from 'store/store';
import { User } from 'store/userSlice';
import { Icon } from 'styles/Globals';
import { Space } from 'styles/layout';
import { Sort } from 'types/feed';

import { ControlCard, FeedButton, OptionTitle } from './styles';

interface DrawerProps {
  contentPosition: number;
  sorting: Sort;
  setSorting: (sort: Sort) => void;
}

export default function DesktopFeedDrawer({ contentPosition,  sorting, setSorting }: DrawerProps ) {
  const user = useSelector((state: RootState) => state.user);
  const { followedUsers, recentUsers } = useSelector((state: RootState) => state.feed);

  const generateUserList = (userList : Array<User> = []) => {
    const filteredList = userList.filter(value => value.id !== user.id);
    return filteredList.map((value) => (
      <UserTile
        key={`usertile-${value.id}`}
        user={value}
      />
    ));
  };

  return (
    <Drawer title="Feed Options" color='backgroundDark' allowOverFlow={true} contentPosition={contentPosition} invisibleScroll >
      <ControlCard>
        <FeedButton color='none' onClick={() => setSorting(Sort.Discover)} selected={sorting === Sort.Discover}>
          <Icon $solid as={DiscoverIcon} $active={sorting === Sort.Discover} $activeColor='primary'/>
          <Space />
          Discover
        </FeedButton>
        <FeedButton color='none' disabled={followedUsers.length === 0} onClick={() => setSorting(Sort.Following)} selected={sorting === Sort.Following} >
          <Icon $solid as={FollowIcon} $active={sorting === Sort.Following} $activeColor='primary'/>
          <Space />
          Following
        </FeedButton>
        <FeedButton color='none' disabled={((user.memberships?.length || 0 ) <= 0)} onClick={() => setSorting(Sort.Memberships)} selected={sorting === Sort.Memberships} >
          <Icon $solid as={CommunityIcon} $active={sorting === Sort.Memberships} $activeColor='primary'/>
          <Space />
          Communities
        </FeedButton>
      </ControlCard>

      { recentUsers.length !== 0 && (
        <ControlCard>
          <OptionTitle>Recently Visited</OptionTitle>
          {generateUserList(recentUsers)}
        </ControlCard>
      )}

      { followedUsers.length !== 0 && (
        <ControlCard>
          <OptionTitle>Followed {followedUsers && `(${followedUsers.length})`}</OptionTitle>
          {generateUserList(followedUsers)}
        </ControlCard>
      )}

    </Drawer>
  );
}

