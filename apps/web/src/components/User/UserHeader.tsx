// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { truncate } from 'lodash';
import { useRouter } from 'next/router';

import { AvatarTypes } from 'components/Avatar/Avatar';
import { AvatarHeader, AvatarHeaderProps } from 'components/UserHeader';
import useMedia from 'hooks/useMedia';
import { User } from 'types/prisma';

// TODO delete UserHeader in src/components/UserHeader/UserHeader.tsx

type Props = {
  user: User;
  onClick?: (user: User) => void
  online?: AvatarHeaderProps['online']
};

const UserHeader: React.FC<Props> = ({
  user,
  online,
  onClick,
}) => {
  const router = useRouter();
  onClick = onClick || (() => router.push(user.username));

  // TODO is length inclusive?
  const username = truncate(user.username, { length: 13 });
  const displayName = truncate(user.name, { length: 18 });

  const avatar = useMedia(user.avatar);

  return (
    <AvatarHeader
      type={AvatarTypes.User}
      image={avatar}
      subtitle={`@${username}`}
      title={displayName}
      online={online}
      // TODO verified is stored on userState.
      // verified={user?.verified}
      onClick={() => onClick ? onClick(user) : router.push(user.username)}
    />
  );
};

export default UserHeader;
