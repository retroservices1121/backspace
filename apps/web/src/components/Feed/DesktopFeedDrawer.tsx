import { Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { useFeed } from '@src/hooks/useFeed';
import useUser from '@src/hooks/useUser';
import { User } from '@src/types/prisma';

import Drawer from 'components/Drawer';
import { OptionTitle } from 'components/Feed/styles';
import UserTile from 'components/User/UserTile';
import { RootState } from 'store/store';
import { Sort } from 'types/feed';

import FeedCard from './FeedCard';
import FeedFilter from './FeedFilter';

interface DrawerProps {
  contentPosition: number;
}

export default function DesktopFeedDrawer({ contentPosition }: DrawerProps ) {
  const { user } = useUser();
  const recentUsers = useSelector((state: RootState) => state.feed.recentUsers);

  return (
    <Drawer
      title="Feed Options"
      color='backgroundDark'
      allowOverFlow={true}
      contentPosition={contentPosition} invisibleScroll
    >
      <FeedCard>
        <FeedFilter />
      </FeedCard>


      {recentUsers && recentUsers.length > 0 && (
        <FeedCard>
          <OptionTitle>New Around Here</OptionTitle>
          {recentUsers.map((u: any) => (
            <UserTile key={`recent-${u.id ?? u.uuid}`} user={u} />
          ))}
        </FeedCard>
      )}

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

    </Drawer>
  );
}

