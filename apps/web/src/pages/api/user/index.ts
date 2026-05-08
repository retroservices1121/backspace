// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions, Prisma, User } from '@prisma/client';
import { createUser, getUserByAuthId, getUserById, getUserByUsername } from '@src/api2/user';
import createHandler from '@src/lib/nextconnect';
import { isDevelopment } from '@src/utils/common_utils';
import { resolve } from 'path';

const handler = createHandler();

handler
  .get(async (req, res) => {
    const {
      query: { id, authId, username },
      body,
    } = req;
    let user : User | null = null;
    if (id) {
      user = await getUserById(BigInt(id as string), false);
    } else if (authId) {
      user = await getUserByAuthId(authId as string, false);
    } else if (username) {
      user = await getUserByUsername(username as string, false);
    } else {
      console.error('fuck');
    }
    res.json(user);
    resolve();
  })
  .post(async (req, res) => {
    const {
      body,
    } = req;
    const user = await createUser(body);
    if (user) {
      try {
        const newBilling : Prisma.BillingCreateInput = {
          user: {
            connect: {
              id: user.id,
            },
          },
        };
        await prisma.billing.create({
          data: newBilling,
        });
      } catch (error) {
        console.error(`Failed to create billing doc ${error}`);
      }

      //Add founder follows
      try { // in a try-catch since not vital
        const faizId = isDevelopment() ? 10 : undefined;
        const dylanId = isDevelopment() ? 37 : undefined;
        await prisma.follow.createMany({
          data: [
            { followerId: user.id, accountId: faizId },
            { followerId: user.id, accountId: dylanId },
          ],
        });
      } catch (error) {
        console.warn('Failed to autofollow founders');
        console.error(error);
      }

      //Create Community
      try {
        const newCommunity : Prisma.CommunityCreateInput = {
          name: `${user.name}'s Space`,
          description: '',
          owner: {
            connect: {
              id: user.id,
            },
          },
          members: {
            create: {
              role: Permissions.OWNER, 
              user: {
                connect: {
                  id: user.id,
                },
              },
            },
          },
        };
        await prisma.community.create({
          data: newCommunity,
        });
      } catch (e) {
        console.error(`Failed to create community. ${e}`);
      }
      
    } else {
      throw new Error('User Not Created');
      
    }

    res.json(user || null);
  });

export default handler;