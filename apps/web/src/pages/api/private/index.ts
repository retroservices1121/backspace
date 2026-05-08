// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Private } from '@prisma/client';
import { createPrivate, getPrivateByUserId } from '@src/api2/private';
import createHandler from '@src/lib/nextconnect';
import { resolve } from 'path';

const handler = createHandler();

handler
  .get(async (req, res) => {
    const {
      query: { id, username }, 
      body,
    } = req;
    let user : Private | null = null;
    if (id) {
      user = await getPrivateByUserId(BigInt(id as string), false);
    } else {
      console.error('fuck');
    }
    res.json({ user });
    resolve();
  })
  .post(async (req, res) => {
    const {
      body,
    } = req;
    const user = await createPrivate(body);
    res.json({ user });
    resolve();
  });

export default handler;