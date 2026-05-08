// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Prisma, Private } from '@prisma/client';
import { createPrivate, getPrivateByUserId, updatePrivate } from '@src/api2/private';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { resolve } from 'path';

// Body of PATCH /api/private — every field optional. The handler only writes
// the keys the caller actually sent.
export type UpdatePrivateBody = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dobYear?: number;
  dobMonth?: number;
  dobDay?: number;
};

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

// PATCH updates the authenticated user's Private row. Identity comes from
// req.authId — body cannot reassign which user the row belongs to.
handler.use(requireAuthMiddleware).patch(async (req, res) => {
  const body = req.body as UpdatePrivateBody;
  const me = await getUserByAuthId(req.authId, false);
  if (!me) {
    res.status(404).end('User not found');
    return;
  }
  const update: Prisma.PrivateUpdateInput = {};
  if (typeof body.firstName === 'string') update.firstName = body.firstName;
  if (typeof body.lastName === 'string') update.lastName = body.lastName;
  if (typeof body.phone === 'string') update.phone = body.phone;
  if (typeof body.dobYear === 'number') update.dobYear = body.dobYear;
  if (typeof body.dobMonth === 'number') update.dobMonth = body.dobMonth;
  if (typeof body.dobDay === 'number') update.dobDay = body.dobDay;
  const updated = await updatePrivate(me.id, update);
  res.json({ user: updated });
});

export default handler;