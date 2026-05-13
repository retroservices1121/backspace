// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions, Prisma, User } from '@prisma/client';
import { getPrivyUserEmail } from '@backspace/auth';
import { normalizeUsername } from '@backspace/usernames';
import { createUser, getUserByAuthId, getUserById, getUserByUsername, updateUser } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { isDevelopment } from '@src/utils/common_utils';
import { resolve } from 'path';

const PRIVY_CFG = {
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
};

// Body of PATCH /api/user — every field optional. The handler only writes
// the keys the caller actually sent, so the form can submit any subset.
export type UpdateUserBody = {
  username?: string;
  name?: string;
  bio?: string;
};

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
    // Resolve the caller's email via Privy so we can honor (or block on)
    // a waitlist reservation. Anonymous callers skip this — they cannot
    // be matched to any reservation and the unique constraint on
    // User.username is the final guardrail anyway.
    let callerEmail: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      callerEmail = await getPrivyUserEmail(token, PRIVY_CFG).catch(() => null);
      if (callerEmail) callerEmail = callerEmail.toLowerCase();
    }
    // Block: if someone else reserved this exact handle on the waitlist
    // and hasn't yet claimed it, the requester cannot grab it via direct
    // app signup.
    const requestedUsernameLower =
      typeof body?.username === 'string' ? normalizeUsername(body.username) : '';
    if (requestedUsernameLower) {
      const conflict = await prisma.waitlistEntry.findUnique({
        where: { usernameLower: requestedUsernameLower },
        select: { email: true, claimedAt: true },
      });
      if (
        conflict &&
        !conflict.claimedAt &&
        conflict.email !== callerEmail
      ) {
        res.status(409).json({
          error: 'waitlist_reserved',
          message: 'Someone reserved that username on the waitlist.',
        });
        return;
      }
    }
    const user = await createUser(body);
    if (user) {
      // Honor a matching waitlist reservation, if any. Best-effort —
      // a failure here must not block the signup.
      if (callerEmail) {
        try {
          await prisma.waitlistEntry.updateMany({
            where: { email: callerEmail, claimedAt: null },
            data: { claimedAt: new Date() },
          });
        } catch (e) {
          console.warn('Failed to mark waitlist entry as claimed', e);
        }
      }
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

// PATCH updates the authenticated user's row. Identity comes from the Privy
// token (req.authId), never from the body — the form cannot impersonate.
handler.use(requireAuthMiddleware).patch(async (req, res) => {
  const body = req.body as UpdateUserBody;
  const me = await getUserByAuthId(req.authId, false);
  if (!me) {
    res.status(404).end('User not found');
    return;
  }
  const update: Prisma.UserUpdateInput = {};
  if (typeof body.username === 'string') update.username = body.username;
  if (typeof body.name === 'string') update.name = body.name;
  if (typeof body.bio === 'string') update.bio = body.bio;
  const updated = await updateUser(me.id, update);
  res.json(updated);
});

export default handler;