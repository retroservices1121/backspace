// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { Button, ButtonLarge } from '@src/styles/Buttons';
import { useRouter } from 'next/router';

import useUser from 'hooks/useUser';
import { APP } from 'pages';
import { useAppDispatch } from 'store/store';
import { FlexSpaceBetween } from 'styles/Flex';
import { User } from 'types/prisma';

import UserHeader from './UserHeader';

type ActionProps = { user: User };

const DefaultActions: React.VFC<ActionProps> = ({
  user,
}) => {
  const { user: currentUser } = useUser();

  if (!user || (user?.id === currentUser?.id)) return null;
  const notFollowing = currentUser.following.findIndex(u => u.accountId === user.id) === -1;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const onFollow = () => {
    // FIXME update userslice probably
  };
  const onMessage = () => {
    //TODO: This has a race condition bug when the conversation doesn't already exist.
    // dispatch(setConversationFromUid(user.id));
    router.push(APP.MESSAGES.INDEX);
  };


  return notFollowing ? (
    <Button
      // color={(callback && 'backgroundLight') || 'primary'}
      color={'primary'}
        selected={notFollowing}
      selectedColor='backgroundLight'
      onClick={onFollow}
    >
      Follow
    </Button>
  ) : (
    <Button
      // color={(callback && 'backgroundLight') || 'primary'}
      color={'primary'}
      selected={notFollowing}
      selectedColor='backgroundLight'
        onClick={onMessage}
    >
      Message
    </Button>
  );
};

type Props = {
  user: User;
  // callback will remain commented out unless you come up with an intelligent name.
  // callback?: (user: User.WithAvatar) => void;
  onClick?: (user: User) => void;
  withDescription?: boolean;
  actions?: React.VFC<ActionProps>;
  noAction?: boolean;
};

const UserTile: React.FC<Props> = ({
  user,
  onClick,
  actions: Actions = DefaultActions,
  noAction,
}) => {  
  return (
    <>
      {user && (
        <FlexSpaceBetween style={{ alignItems: 'center', textAlign: 'left', width: '100%' }}>
          <UserHeader user={user} onClick={onClick} />
          {!noAction && <Actions user={user} />}
        </FlexSpaceBetween>
      )}
    </>
  );
};

export default UserTile;
