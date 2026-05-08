// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createUserState } from '@src/api2/userState';
import createHandler from '@src/lib/nextconnect';
import { resolve } from 'path';

const handler = createHandler();

handler
  .post(async (req, res) => {
    const {
      body,
    } = req;
    const result = await createUserState(body);
    res.json({ result });
    resolve();
  });

export default handler;