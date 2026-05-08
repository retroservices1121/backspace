// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { GetChannelById } from 'api2/channel';
import routes from 'routes';
import { Channel } from 'types/prisma';

import axios from '../axios';

const Channels = (route: string) => ({
  get(channelId: bigint) {
    return axios().get<GetChannelById>(`${route}/${channelId}`);
  },
  edit(channelId: string) {
    throw new Error('Not implemented');
  },
  delete(channelId: string) {
    throw new Error('Not implemented');
  },
});

export default Channels;
