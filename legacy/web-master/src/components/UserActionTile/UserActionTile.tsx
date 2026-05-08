import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setFollowUser } from 'api/userAPI';
import UserHeader from 'components/UserHeader';
import useRouting from 'hooks/useRouting';
import { APP } from 'pages';
import { setConversationFromUid } from 'store/directMessageSlice';
import { fetchFollowedUsers } from 'store/feedSlice';
import { RootState } from 'store/store';
import { User } from 'store/userSlice';
import { FlexSpaceBetween } from 'styles/Flex';

import { ActionTileButton } from './styled';

type Props = {
  user: User;
  callback?: (user: User) => void;
  clickOverride?: (user: User) => void;
  callbackText?: string | null;
  withDescription?: boolean;
};

const UserTile: React.FC<Props> = ({ user, callback, callbackText, withDescription, clickOverride }) => {
  const history = useRouting();
  const dispatch = useDispatch();
  const uid = useSelector((state : RootState) => state.user.id);
  const { followedUsers } = useSelector((state : RootState) => state.feed);
  const [Following, setFollowing] = useState<boolean>();

  const onClick = () => {
    if (callback) {
      callback(user);
    } else {
      setFollowUser(uid, user.id, !Following).then(() => {
        setFollowing(!Following);
        dispatch(fetchFollowedUsers(uid));
      });
    }
  };

  const routeToMessage = () => {
    //TODO: This has a race condition bug when the conversation doesn't already exist.
    dispatch(setConversationFromUid(user.id));
    history.navigate(APP.MESSAGES.INDEX);
  };

  useEffect(() => {
    const temp = followedUsers.filter(value => value?.id == user.id)?.length > 0 ? true : false;
    setFollowing(temp);
  }, [followedUsers]);

  return (
    <FlexSpaceBetween style={{ alignItems: 'center', textAlign: 'left', width: '100%' }}>
      <UserHeader user={user} clickOverride={clickOverride} withDescription={withDescription} />
      {callbackText !== null && user.id !== uid ? !Following ?
        <ActionTileButton
          color={(callback && 'backgroundLight') || 'primary'}
          selected={Following}
          selectedColor='backgroundLight'
          onClick={onClick}
        >
          Follow
        </ActionTileButton>
        :
        <ActionTileButton
          color={(callback && 'backgroundLight') || 'primary'}
          selected={Following}
          selectedColor='backgroundLight'
          onClick={routeToMessage}
        >
          Message
        </ActionTileButton> : null
      }
    </FlexSpaceBetween>
  );
};

export default UserTile;
