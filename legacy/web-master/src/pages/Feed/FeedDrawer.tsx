// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useDispatch, useSelector } from 'react-redux';

import MobileDrawer from 'components/DrawerV2';
import UserTile from 'components/UserActionTile';
import { ReactComponent as DiscoverIcon } from 'graphics/commonicons/discover.svg';
import { ReactComponent as FollowIcon } from 'graphics/commonicons/heart.svg';
import { ReactComponent as CommunityIcon } from 'graphics/navigation/channel.svg';
import { toggleDrawer } from 'store/appSlice';
import { RootState } from 'store/store';
import { User } from 'store/userSlice';
import { Icon } from 'styles/Globals';
import { Space } from 'styles/layout';
import { Sort } from 'types/feed';

import { ControlCard, FeedButton, OptionTitle } from './styles';

const filters = [
  {
    name: 'Discover',
    sort: Sort.Discover,
    icon: DiscoverIcon,
  },
  {
    name: 'Following',
    sort: Sort.Following,
    icon: FollowIcon,
  },
  {
    name: 'Communities',
    sort: Sort.Memberships,
    icon: CommunityIcon,
  },

];

interface DrawerProps {
  sorting: Sort;
  setSorting: (sort: Sort) => void ;
}

export default function FeedDrawer({ sorting, setSorting }: DrawerProps ) {
  const user = useSelector((state: RootState) => state.user);
  const { followedUsers, recentUsers } = useSelector((state: RootState) => state.feed);
  const dispatch = useDispatch();

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
		<MobileDrawer>
			<>
				{/* Filters */}
				<ControlCard>
					{filters.map((filter) => (
						<FeedButton color='none' onClick={() => {
						  setSorting(filter.sort);
						  dispatch(toggleDrawer());
						}} selected={sorting === filter.sort}>
							<Icon $solid as={filter.icon} $active={sorting === filter.sort} $activeColor='primary'/>
							<Space />
							{filter.name}
						</FeedButton>
					))}
				</ControlCard>

				{/* Recently Visited */}
				{ recentUsers.length !== 0 && (
					<ControlCard>
						<OptionTitle>Recently Visited</OptionTitle>
						{generateUserList(recentUsers)}
					</ControlCard>
				)}

				{/* Followed Users */}
				{ followedUsers.length !== 0 && (
					<ControlCard>
						<OptionTitle>Followed {followedUsers && `(${followedUsers.length})`}</OptionTitle>
						{generateUserList(followedUsers)}
					</ControlCard>
				)}
			</>
		</MobileDrawer>
  );
}

