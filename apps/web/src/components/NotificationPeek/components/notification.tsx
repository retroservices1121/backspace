// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { AvatarTypes } from '@src/components/Avatar/Avatar';
import { AvatarHeader } from '@src/components/UserHeader';
import useMedia from '@src/hooks/useMedia';
import { User } from '@src/types/prisma';
import { Notification } from '@src/types/prisma';
import { truncate } from 'lodash';
import { useRouter } from 'next/router';


export type NotifType = {
  title: string, 
  text: string,
  timeAgo: string,
  user: User,
  notification: Notification
};

type Props = {
  notification: NotifType;
  onClick: () => void;
};

const CompactNotification: React.FC<Props> = ({
  notification : notif,
  onClick,
}) => {
  const router = useRouter();

  // TODO is length inclusive?
  // const username = truncate(notif.user?.username, { length: 13 });
  // const displayName = truncate(notif.user?.name, { length: 18 });

  const avatar = useMedia(notif.user?.avatar);

  return (
    <AvatarHeader
      type={AvatarTypes.Profile}
      image={avatar}
      subtitle={notif.text}
      title={notif.title}
      verified={notif.user?.verified}
      onClick={onClick}
    />
  );
};

export default CompactNotification;
