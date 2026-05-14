// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import prisma from '@src/api2/prisma';
import { Prisma, User } from '@prisma/client';
import createHandler from '@src/lib/nextconnect';

const handler = createHandler();

handler
  .get(async (req, res) => {
    const {
      query: { search },
    } = req;
    let users : User[] = [];
    users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { startsWith: search as string } },
          { name: { startsWith: search as string } },
        ],
      },
      orderBy: {
        username: Prisma.SortOrder.asc,
      },
    });
    res.json(users);
  });


export default handler;