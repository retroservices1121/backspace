// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions } from '@prisma/client';
import { capitalize } from 'lodash';

import { Button } from 'styles/Buttons';
import { OldCol, OldRow } from 'styles/Flex';
import { Space } from 'styles/layout';
import { Channel } from 'types/prisma'; 

import { TextHighlight } from './styled';

type NoChannelAccessProps = {
  channel: Channel;
  onSubscribe: () => void;
};

const NoChannelAccess: React.VFC<NoChannelAccessProps> = ({
  channel,
  onSubscribe,
}) => (
  <OldCol $full $center>
    <OldRow $center>
      {'You need to be a community rank'}
      <TextHighlight>"{capitalize(channel.readPermission)}"</TextHighlight>
      {' or higher to view this room.'}
    </OldRow>
    <Space direction='column' size='sm' />
    {channel.readPermission == Permissions.SUBSCRIBER && (
      <Button color='none' onClick={onSubscribe}>
        Subscribe to Community
      </Button>
    )}
  </OldCol>
);

export default NoChannelAccess;
