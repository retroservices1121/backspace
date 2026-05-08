// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { User } from '@prisma/client';
import { getMyUser } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .get(async (req, res) => {
    //AuthId is guaranteed based on middleware
    const myAuthId = req.authId;
    let user : User | null = null;
    //Only allow fetching the requesting user's data
    user = await getMyUser({ authId: myAuthId });
    res.status(200).json(user);
  });

export default handler;
