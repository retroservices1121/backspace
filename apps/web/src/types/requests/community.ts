// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import * as Types from '@prisma/client';

type DbMeta = 'id' | 'uuid' | 'fbId' | 'createdAt';

export type CreateChannelBody = Omit<Types.Channel, DbMeta | 'hidden' | 'communityId'>;