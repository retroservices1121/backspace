import { Dispatch, SetStateAction } from 'react';
import { useFeed } from '@src/hooks/useFeed';
import useUser from '@src/hooks/useUser';
import { User } from '@src/types/prisma';

import Drawer from 'components/Drawer';
import { OptionTitle } from 'components/Feed/styles';
import UserTile from 'components/User/UserTile';
import { Sort } from 'types/feed';

import FeedCard from './FeedCard';
import FeedFilter from './FeedFilter';

interface DrawerProps {
  contentPosition: number;
}

export default function DesktopFeedDrawer({ contentPosition }: DrawerProps ) {
  const { user } = useUser();

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
      

      {/* { recentUsers.length !== 0 && (
        <FeedCard>
          <OptionTitle>Recently Visited</OptionTitle>
          {generateUserList(recentUsers)}
        </FeedCard>
      )} */}

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

