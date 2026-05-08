// GET /api/community/[id]/billing
//
// What the user-side subscription purchase form needs to know:
//   - Which tiers this community sells (with Stripe price IDs).
//   - The community owner's Stripe Connect account ID — that's the
//     transfer destination on POST /api/billing/subscription.
//
// Auth-required (consistent with the rest of the app), but not
// owner-scoped: any signed-in user can see what a community sells so
// the purchase modal can render. We do not return the full Stripe
// account object, just the accountId — that's what the subscription
// route needs and nothing more.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .get(async (req, res) => {
    const { id } = req.query;
    if (typeof id !== 'string') {
      res.status(HttpStatus.BAD_REQUEST).end('id required');
      return;
    }

    let communityId: bigint;
    try {
      communityId = BigInt(id);
    } catch {
      res.status(HttpStatus.BAD_REQUEST).end('id must be numeric');
      return;
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: {
        id: true,
        tiers: {
          select: {
            id: true,
            uuid: true,
            title: true,
            description: true,
            perks: true,
            price: true,
            stripePriceId: true,
          },
        },
        owner: {
          select: {
            billing: {
              select: {
                account: { select: { accountId: true } },
              },
            },
          },
        },
      },
    });

    if (!community) {
      res.status(HttpStatus.NOT_FOUND).end('Community not found');
      return;
    }

    res.json({
      tiers: community.tiers.map((t) => ({
        id: t.id.toString(),
        uuid: t.uuid,
        title: t.title,
        description: t.description,
        perks: t.perks,
        price: t.price,
        stripePriceId: t.stripePriceId,
      })),
      ownerAccountId: community.owner?.billing?.account?.accountId ?? null,
    });
  });

export default handler;
