// Tier mutation endpoints. Like the create route, gated on
// community ownership.
//
//   PATCH /api/community/[id]/tiers/[tierId]
//     Body: { title?, description?, perks?, priceUsd? }
//     Updating priceUsd disables the old Stripe price and mints a
//     new one (Stripe prices are immutable). Existing subscriptions
//     keep paying the old price; new purchases use the new one.
//
//   DELETE /api/community/[id]/tiers/[tierId]
//     Disables the Stripe price (so no new subscriptions can attach)
//     and removes the Stripe product. The DB row stays so historical
//     Subscription FK references survive — the row's stripePriceId
//     is set to null and price preserved for reporting.

import prisma from '@src/api2/prisma';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import {
  createStripePrice,
  disableStripePrice,
  removeStripeProduct,
} from '@src/lib/stripe';
import HttpStatus from 'http-status-codes';

const handler = createHandler();

async function loadTier(communityIdParam: string, tierIdParam: string) {
  let communityId: bigint;
  let tierId: bigint;
  try {
    communityId = BigInt(communityIdParam);
    tierId = BigInt(tierIdParam);
  } catch {
    return null;
  }
  const tier = await prisma.subscriptionTier.findUnique({
    where: { id: tierId },
    include: { community: { select: { id: true, ownerId: true } } },
  });
  if (!tier || tier.community.id !== communityId) return null;
  return tier;
}

handler
  .use(requireAuthMiddleware)
  .patch(async (req, res) => {
    const { id, tierId } = req.query;
    if (typeof id !== 'string' || typeof tierId !== 'string') {
      res.status(HttpStatus.BAD_REQUEST).end('id and tierId required');
      return;
    }
    const user = await getUserByAuthId(req.authId);
    if (!user) {
      res.status(HttpStatus.UNAUTHORIZED).end('Not authorized');
      return;
    }
    const tier = await loadTier(id, tierId);
    if (!tier) {
      res.status(HttpStatus.NOT_FOUND).end('Tier not found');
      return;
    }
    if (tier.community.ownerId !== user.id) {
      res.status(HttpStatus.FORBIDDEN).end('Owner only');
      return;
    }

    const body = (req.body ?? {}) as {
      title?: string;
      description?: string;
      perks?: string[];
      priceUsd?: number;
    };

    let nextStripePriceId: string | null = tier.stripePriceId;
    let nextPrice: number = tier.price;

    if (typeof body.priceUsd === 'number' && body.priceUsd > 0 && body.priceUsd !== tier.price) {
      // Stripe prices are immutable. Mint a new one and disable the
      // old. Existing subscribers stay on the old price (Stripe
      // bills against the price ID stored on each subscription).
      if (tier.stripePriceId) {
        try {
          await disableStripePrice(tier.stripePriceId);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('failed to disable old stripe price', err);
        }
      }
      const priceCents = Math.round(body.priceUsd * 100);
      const newPrice = await createStripePrice(priceCents, tier.uuid, user.authId);
      nextStripePriceId = newPrice.id;
      nextPrice = body.priceUsd;
    }

    const updated = await prisma.subscriptionTier.update({
      where: { id: tier.id },
      data: {
        title: body.title ?? tier.title,
        description: body.description ?? tier.description,
        perks: body.perks ?? tier.perks,
        price: nextPrice,
        stripePriceId: nextStripePriceId,
      },
    });

    res.json({
      tier: {
        id: updated.id.toString(),
        uuid: updated.uuid,
        title: updated.title,
        description: updated.description,
        perks: updated.perks,
        price: updated.price,
        stripePriceId: updated.stripePriceId,
      },
    });
  })
  .delete(async (req, res) => {
    const { id, tierId } = req.query;
    if (typeof id !== 'string' || typeof tierId !== 'string') {
      res.status(HttpStatus.BAD_REQUEST).end('id and tierId required');
      return;
    }
    const user = await getUserByAuthId(req.authId);
    if (!user) {
      res.status(HttpStatus.UNAUTHORIZED).end('Not authorized');
      return;
    }
    const tier = await loadTier(id, tierId);
    if (!tier) {
      res.status(HttpStatus.NOT_FOUND).end('Tier not found');
      return;
    }
    if (tier.community.ownerId !== user.id) {
      res.status(HttpStatus.FORBIDDEN).end('Owner only');
      return;
    }

    if (tier.stripePriceId) {
      try {
        await disableStripePrice(tier.stripePriceId);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('failed to disable stripe price on tier delete', err);
      }
    }
    try {
      await removeStripeProduct(tier.uuid);
    } catch (err) {
      // Stripe rejects product deletion when there are active
      // subscriptions or one-time purchases — that's expected for any
      // tier with subscribers. Logging is enough; the DB stays
      // consistent because we null out stripePriceId anyway.
      // eslint-disable-next-line no-console
      console.warn('failed to remove stripe product on tier delete', err);
    }

    await prisma.subscriptionTier.update({
      where: { id: tier.id },
      data: { stripePriceId: null },
    });

    res.json({ ok: true });
  });

export default handler;
