// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { ReservedUser } from '@prisma/client';
import { getReservedUserById, getReservedUserByUsername } from '@src/api2/reservedUser';
import createHandler from '@src/lib/nextconnect';
import { resolve } from 'path';

const handler = createHandler();

handler
  .get(async (req, res) => {
    const {
      query: { id, username }, 
      method, 
      body,
    } = req;
    let user : ReservedUser | null = null;
    if (id) {
      user = await getReservedUserById(BigInt(id as string), false);
    } else if (username) {
      user = await getReservedUserByUsername(username as string, false);
    } else {
      console.error('fuck');
    }
    res.json(user);
    resolve();
  });

export default handler;