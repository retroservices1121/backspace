// /api/dflow/trades — Dflow swap audit log.
//
// Record-only (mirrors /api/markets/[id]/trade for Polymarket): the
// swap already executed on Solana via Dflow's aggregator, signed by
// the user's Privy embedded wallet. This route just writes a row so
// the app can surface recent activity / power future leaderboards
// without re-querying RPC.
//
// Source of truth for balances + holdings is Solana RPC — this table
// is not a balance ledger.
//
// POST body: { txSignature, inputMint, inputAmount, outputMint,
//              outputAmount, walletAddress }
//   - Dedupes on txSignature (UNIQUE). Re-POSTing the same swap is a
//     no-op upsert, not a duplicate row.
// GET: returns the caller's recent swaps (limit 50), newest first.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

type TradeBody = {
  txSignature?: string;
  inputMint?: string;
  inputAmount?: string;
  outputMint?: string;
  outputAmount?: string;
  walletAddress?: string;
};

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.post(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!user) return res.status(HttpStatus.NOT_FOUND).end('user not found');

  const body = (req.body ?? {}) as TradeBody;
  if (!body.txSignature || !body.inputMint || !body.outputMint) {
    return res.status(HttpStatus.BAD_REQUEST).end('missing fields');
  }
  // Atomic amounts are strings (u64-safe). Reject anything that isn't
  // a non-negative integer string.
  for (const f of ['inputAmount', 'outputAmount'] as const) {
    const v = body[f] ?? '';
    if (!/^\d+$/.test(v)) {
      return res.status(HttpStatus.BAD_REQUEST).end(`invalid ${f}`);
    }
  }

  // Resolve / upsert the Solana wallet. Only attribute when this row
  // belongs to the caller — defensive against a client sending another
  // user's address.
  let walletId: bigint | null = null;
  if (body.walletAddress) {
    const wallet = await prisma.wallet.upsert({
      where: { walletIdentity: { chain: 'solana', address: body.walletAddress } },
      create: {
        chain: 'solana',
        address: body.walletAddress,
        custodial: true,
        verifiedAt: new Date(),
        userId: user.id,
      },
      update: {},
      select: { id: true, userId: true },
    });
    if (wallet.userId === user.id) walletId = wallet.id;
  }

  // Resolve catalog FKs by mint when we know the token. Mints outside
  // our catalog still get a row — just without a Token link.
  const tokens = await prisma.token.findMany({
    where: { mint: { in: [body.inputMint, body.outputMint] } },
    select: { id: true, mint: true },
  });
  const byMint = new Map(tokens.map((t) => [t.mint, t.id]));

  const data = {
    userId: user.id,
    walletId,
    inputMint: body.inputMint,
    inputAmount: body.inputAmount as string,
    outputMint: body.outputMint,
    outputAmount: body.outputAmount as string,
    inputTokenId: byMint.get(body.inputMint) ?? null,
    outputTokenId: byMint.get(body.outputMint) ?? null,
    txSignature: body.txSignature,
    venue: 'DFLOW',
  };

  const trade = await prisma.tokenTrade.upsert({
    where: { txSignature: body.txSignature },
    create: data,
    update: {},
    select: { id: true, uuid: true, createdAt: true },
  });

  return res.status(HttpStatus.CREATED).json({
    id: trade.id.toString(),
    uuid: trade.uuid,
    createdAt: trade.createdAt,
  });
});

handler.get(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!user) return res.status(HttpStatus.NOT_FOUND).end('user not found');

  const requested = Number.parseInt((req.query.limit as string) ?? '', 10);
  const limit = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, 100)
    : 50;

  const trades = await prisma.tokenTrade.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { inputToken: true, outputToken: true },
  });

  const shape = (tok: typeof trades[number]['inputToken']) => (tok
    ? { symbol: tok.symbol, decimals: tok.decimals, logoURI: tok.logoURI }
    : null);

  return res.json(
    trades.map((t) => ({
      id: t.id.toString(),
      createdAt: t.createdAt,
      inputMint: t.inputMint,
      inputAmount: t.inputAmount,
      outputMint: t.outputMint,
      outputAmount: t.outputAmount,
      txSignature: t.txSignature,
      venue: t.venue,
      inputToken: shape(t.inputToken),
      outputToken: shape(t.outputToken),
    })),
  );
});

export default handler;
