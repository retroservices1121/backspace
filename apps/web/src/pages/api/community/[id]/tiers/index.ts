// Tier creation for the community owner. Mints a Stripe Product +
// Price, persists the SubscriptionTier with stripePriceId so the
// user-side purchase modal can hand it to /api/billing/subscription.
//
//   POST /api/community/[id]/tiers
//     Body: { title, description?, perks?, priceUsd }
//
// Auth: caller must be the community owner. We do not allow admins
// here because tier publication has financial consequences (mints
// real Stripe products); only the owner who actually controls the
// Stripe account should be able to do this.

import { v4 as uuidv4 } from 'uuid';
import prisma from '@src/api2/prisma';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { createPriceAndProduct } from '@src/lib/stripe';
import HttpStatus from 'http-status-codes';

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .post(async (req, res) => {
    const { id } = req.query;
    if (typeof id !== 'string') {
      res.status(HttpStatus.BAD_REQUEST).end('community id required');
      return;
    }
    let communityId: bigint;
    try {
      communityId = BigInt(id);
    } catch {
      res.status(HttpStatus.BAD_REQUEST).end('community id must be numeric');
      return;
    }

    const user = await getUserByAuthId(req.authId);
    if (!user) {
      res.status(HttpStatus.UNAUTHORIZED).end('Not authorized');
      return;
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true, ownerId: true },
    });
    if (!community) {
      res.status(HttpStatus.NOT_FOUND).end('Community not found');
      return;
    }
    if (community.ownerId !== user.id) {
      res.status(HttpStatus.FORBIDDEN).end('Owner only');
      return;
    }

    const body = (req.body ?? {}) as {
      title?: string;
      description?: string;
      perks?: string[];
      priceUsd?: number;
    };
    if (!body.title || typeof body.priceUsd !== 'number' || body.priceUsd <= 0) {
      res.status(HttpStatus.BAD_REQUEST).end('title and a positive priceUsd are required');
      return;
    }

    // Stripe products are keyed by id; we use a UUID so the Stripe
    // product id and our SubscriptionTier.uuid line up — handy when
    // diagnosing without joining tables.
    const tierUuid = uuidv4();
    const priceCents = Math.round(body.priceUsd * 100);

    const stripePrice = await createPriceAndProduct(
      body.title,
      priceCents,
      tierUuid,
      user.authId,
    );

    const tier = await prisma.subscriptionTier.create({
      data: {
        uuid: tierUuid,
        title: body.title,
        description: body.description ?? '',
        perks: body.perks ?? [],
        price: body.priceUsd,
        stripePriceId: stripePrice.id,
        community: { connect: { id: communityId } },
      },
    });

    res.json({
      tier: {
        id: tier.id.toString(),
        uuid: tier.uuid,
        title: tier.title,
        description: tier.description,
        perks: tier.perks,
        price: tier.price,
        stripePriceId: tier.stripePriceId,
      },
    });
  });

export default handler;
