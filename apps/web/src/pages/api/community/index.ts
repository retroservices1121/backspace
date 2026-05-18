// POST /api/community
//
// Self-serve community creation. The caller becomes the owner,
// gets seeded as an OWNER-role Member, and a default 'general'
// CHAT channel is created so the new community is usable
// immediately (no "Pick a room to get started" empty state on
// first entry).
//
// One-per-user rule: each user can own at most one community.
// Hard-blocked here at the API; the UI gates the CTA on the
// same condition. If a user already owns one, we return 409 with
// a pointer to their existing community uuid so the client can
// navigate them there instead of erroring blind.

import { ChannelType, Permissions } from '@prisma/client';

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const NAME_MIN = 2;
const NAME_MAX = 60;
const DESC_MAX = 500;

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.post(async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end();

  // One community per owner. Check first so we don't waste a
  // transaction on a doomed insert.
  const existing = await prisma.community.findFirst({
    where: { ownerId: me.id, archivedAt: null },
    select: { uuid: true, name: true },
  });
  if (existing) {
    return res.status(HttpStatus.CONFLICT).json({
      error: 'already-owns-community',
      message: 'You already own a community.',
      community: existing,
    });
  }

  const body = (req.body ?? {}) as {
    name?: unknown;
    description?: unknown;
  };
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 'invalid-name',
      message: `Name must be ${NAME_MIN}–${NAME_MAX} characters.`,
    });
  }
  if (description.length > DESC_MAX) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 'invalid-description',
      message: `Description must be at most ${DESC_MAX} characters.`,
    });
  }

  // Create community + default channel + owner membership in a
  // single transaction. If any step fails we don't want to leave
  // a community without a member or a channel.
  const created = await prisma.$transaction(async (tx) => {
    const community = await tx.community.create({
      data: {
        name,
        description,
        allowJoin: true,
        owner: { connect: { id: me.id } },
        channelOrder: [],
      },
    });

    const channel = await tx.channel.create({
      data: {
        type: ChannelType.CHAT,
        name: 'general',
        description: 'Welcome — say hi.',
        readPermission: Permissions.EVERYONE,
        writePermission: Permissions.EVERYONE,
        community: { connect: { id: community.id } },
      },
    });

    // Seed channelOrder so the UI's first-channel auto-select hits
    // 'general' instead of falling back to map-order chance.
    const withOrder = await tx.community.update({
      where: { id: community.id },
      data: { channelOrder: [channel.uuid] },
    });

    await tx.member.create({
      data: {
        role: Permissions.OWNER,
        community: { connect: { id: community.id } },
        user: { connect: { id: me.id } },
      },
    });

    return { community: withOrder, channel };
  });

  return res.status(HttpStatus.CREATED).json({
    id: created.community.id.toString(),
    uuid: created.community.uuid,
    name: created.community.name,
    description: created.community.description,
    channelUuid: created.channel.uuid,
  });
});

export default handler;
