// POST /api/markets/[id]/trade — record-only trade log.
//
// The server does NOT execute trades: Polymarket's CLOB already did,
// client-side, signed by the user's Privy wallet. This route just
// writes an audit row so the app has a local record of what the user
// did (powers social features / activity later).
//
// Positions are NOT recomputed here — they are read from Polymarket's
// Data API (see /api/polymarket/positions). This is intentionally a
// thin log, not a position engine.
//
// Dedupe: venueOrderId is @unique, so a double-submit / retry of the
// same executed order upserts to the same row instead of duplicating.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { TradeSide } from '@prisma/client';
import HttpStatus from 'http-status-codes';

type TradeBody = {
  venueOrderId?: string | null;
  tokenID?: string;
  side?: string;
  shares?: string;
  priceUsd?: string | null;
  status?: string;
  safeAddress?: string;
};

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.post(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!user) return res.status(HttpStatus.NOT_FOUND).end('user not found');

  let marketId: bigint;
  try {
    marketId = BigInt(req.query.id as string);
  } catch {
    return res.status(HttpStatus.BAD_REQUEST).end('invalid market id');
  }

  const body = (req.body ?? {}) as TradeBody;
  const sideRaw = (body.side ?? '').toUpperCase();
  if (sideRaw !== 'BUY' && sideRaw !== 'SELL') {
    return res.status(HttpStatus.BAD_REQUEST).end('invalid side');
  }
  const side = sideRaw as TradeSide;

  if (!body.tokenID) {
    return res.status(HttpStatus.BAD_REQUEST).end('missing tokenID');
  }
  const shares = body.shares ?? '';
  if (!shares || !Number.isFinite(Number(shares)) || Number(shares) <= 0) {
    return res.status(HttpStatus.BAD_REQUEST).end('invalid shares');
  }
  // priceUsd is NOT NULL on Trade — a market order that filled always
  // has a price, but if the client couldn't derive one fall back to 0
  // rather than reject (this is an audit log, not a ledger).
  const priceUsd =
    body.priceUsd != null && Number.isFinite(Number(body.priceUsd))
      ? body.priceUsd
      : '0';

  // The market + outcome must exist locally — tokenID is the Outcome's
  // externalId (the Polymarket CLOB token id).
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true },
  });
  if (!market) return res.status(HttpStatus.NOT_FOUND).end('market not found');

  const outcome = await prisma.outcome.findUnique({
    where: { marketOutcome: { marketId, externalId: body.tokenID } },
    select: { id: true },
  });
  if (!outcome) {
    return res.status(HttpStatus.NOT_FOUND).end('outcome not found');
  }

  // Link the user's Safe (the non-custodial proxy wallet that actually
  // holds funds + outcome tokens). Upsert it so Phase 8's positions
  // proxy can resolve the caller's Safe address from our own tables.
  let walletId: bigint | null = null;
  if (body.safeAddress) {
    const address = body.safeAddress.toLowerCase();
    const wallet = await prisma.wallet.upsert({
      where: { walletIdentity: { chain: 'polygon', address } },
      create: {
        chain: 'polygon',
        address,
        custodial: false,
        verifiedAt: new Date(),
        userId: user.id,
      },
      update: {},
      select: { id: true, userId: true },
    });
    // Only attribute if this Safe belongs to the caller.
    if (wallet.userId === user.id) walletId = wallet.id;
  }

  // venueOrderId is the natural dedupe key. When absent (shouldn't
  // happen for a filled order, but be defensive) just insert.
  const data = {
    userId: user.id,
    marketId,
    outcomeId: outcome.id,
    walletId,
    side,
    shares,
    priceUsd,
    venueOrderId: body.venueOrderId ?? null,
  };
  const select = { id: true, uuid: true, createdAt: true };

  let trade;
  if (body.venueOrderId) {
    trade = await prisma.trade.upsert({
      where: { venueOrderId: body.venueOrderId },
      create: data,
      update: {},
      select,
    });
  } else {
    trade = await prisma.trade.create({ data, select });
  }

  res.status(HttpStatus.CREATED).json({
    id: trade.id.toString(),
    uuid: trade.uuid,
    createdAt: trade.createdAt,
  });
});

export default handler;
