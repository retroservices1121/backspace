// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions, Prisma, User } from '@prisma/client';
import { getPrivyUserEmailById } from '@backspace/auth';
import { normalizeUsername } from '@backspace/usernames';
import prisma from '@src/api2/prisma';
import { createUser, getUserByAuthId, getUserById, getUserByUsername, updateUser } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { resolve } from 'path';

const PRIVY_CFG = {
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
};

// Official accounts every new user auto-follows on signup so they get
// product updates in their feed from day one. Resolved by username at
// signup time, so a handle that hasn't onboarded yet is just skipped.
// Keep in sync with packages/db/scripts/backfill-auto-follows.cjs.
const AUTO_FOLLOW_USERNAMES = ['jp', 'backspace'];

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
    // req.authId is the verified Privy DID set by the createHandler
    // middleware. Resolve the email from it, not the access token.
    let callerEmail: string | null = null;
    if (req.authId) {
      callerEmail = await getPrivyUserEmailById(req.authId, PRIVY_CFG).catch(() => null);
      if (callerEmail) callerEmail = callerEmail.toLowerCase();
    }
    // Beta gate: account creation is restricted to people on the
    // waitlist. Legacy users come in through /api/auth/claim (which
    // rewrites an existing row) and never reach this path; everyone
    // else must have a WaitlistEntry for their verified Privy email.
    // Remove this block when the beta opens to the public.
    const onWaitlist = callerEmail
      ? await prisma.waitlistEntry.findUnique({
        where: { email: callerEmail },
        select: { email: true },
      })
      : null;
    if (!onWaitlist) {
      res.status(403).json({
        error: 'not_on_waitlist',
        message:
          'Backspace is in private beta — join the waitlist to get access.',
      });
      return;
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
      // Honor the matching waitlist reservation, if any. We only
      // claim the one row whose email + handle both match the new
      // User — leaves any other reservations under the same email
      // (a person can reserve multiple handles) unclaimed so they
      // can be claimed on future signups.
      if (callerEmail && requestedUsernameLower) {
        try {
          await prisma.waitlistEntry.updateMany({
            where: {
              email: callerEmail,
              usernameLower: requestedUsernameLower,
              claimedAt: null,
            },
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

      // Auto-follow the official accounts. Users can unfollow manually
      // from the profile page afterwards — this only seeds the follow
      // at signup, it is not enforced.
      try { // in a try-catch since not vital
        const officialAccounts = await prisma.user.findMany({
          where: { username: { in: AUTO_FOLLOW_USERNAMES } },
          select: { id: true },
        });
        const follows = officialAccounts
          .filter((account) => account.id !== user.id)
          .map((account) => ({ followerId: user.id, accountId: account.id }));
        if (follows.length > 0) {
          await prisma.follow.createMany({ data: follows, skipDuplicates: true });
        }
      } catch (error) {
        console.warn('Failed to auto-follow official accounts');
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