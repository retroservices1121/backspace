// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import useUser from '@src/hooks/useUser';

import MobileDrawer from 'components/DrawerV2';
import { ControlCard, OptionTitle } from 'components/Feed/styles';
import UserTile from 'components/User/UserTile';

import FeedCard from './FeedCard';
import FeedFilter from './FeedFilter';

export default function FeedDrawer() {
  const { user } = useUser();

  return (
		<MobileDrawer>
			<>
				{/* Filters */}
				<ControlCard className="rounded-3xl my-6 sm:my-10 py-8 sm:py-10 px-4 sm:px-12">
					<FeedFilter />
				</ControlCard>

        { user?.following?.length !== 0 && (
          <FeedCard>
            <OptionTitle>Following {`(${user.following.length})`}</OptionTitle>
            {
              user.following.map((follow) => {
                return (
                  <UserTile
                    key={`usertile-${follow.id}`}
                    user={follow.account}
                  />
                );
              })
              // generateUserList(user.following.map((each) => each.account))
            }
          </FeedCard>
        )}
			</>
		</MobileDrawer>
  );
}

