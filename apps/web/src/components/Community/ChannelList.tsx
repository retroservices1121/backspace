// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { Permissions } from '@prisma/client';
import useUser from '@src/hooks/useUser';

import useCommunity from 'hooks/entities/useCommunities';
import useModals from 'hooks/useModals';
import constants from 'styles/Globals';

import ChannelItem from './ChannelItem';
import CreateChannelModal from './CreateChannel';

type Props = {};

const ChannelList: React.VFC<Props> = () => {
  const { run: { changeChannel }, current: {  owner, role, channels, channel } } = useCommunity();
  const { toggleDrawer } = useModals();
  const { user } = useUser();
  return (
    <>
      <CreateChannelModal edit={true}/>
      {channels?.map(ch => {
        return <ChannelItem
          role={owner === user.id ? Permissions.OWNER : role}
          key={ch.uuid}
          channelId={ch.uuid}
          // TODO writePermission?
          locked={ch.readPermission > role}
          active={ch.uuid === channel?.uuid}
          handler={() => {
            // Below the sm breakpoint the drawer is a fixed overlay —
            // close it on selection so the channel feed is visible.
            if (window.innerWidth <= parseInt(constants.SMALLSCREEN_WIDTH, 10)) {
              toggleDrawer();
            }
            changeChannel(ch.uuid);
          }}
        />;
      })}
    </>
  );
};
export default ChannelList;
