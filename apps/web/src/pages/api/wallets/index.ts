// GET   /api/wallets        — list current user's wallets
// POST  /api/wallets        — upsert from Privy's linkedAccounts (full sync)
//
// The client calls POST with the full set of wallets Privy reports for this
// user; the server treats that as authoritative for THIS user only and:
//   - upserts each (chain, address) under userId
//   - flips isPrimary so exactly one wallet is primary per user
//   - deletes wallets we have but Privy no longer reports
//
// Wallet ownership is bound to userId here. We do NOT trust the client to
// claim wallets owned by other users — the @@unique([chain, address])
// constraint protects us if a wallet is somehow owned elsewhere (we'll see a
// Prisma P2002 and reject the row).

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';
import type { Prisma } from '@prisma/client';

type WalletInput = {
  chain: string;
  address: string;
  custodial?: boolean;
  isPrimary?: boolean;
};

const NORMALIZED_CHAINS = new Set([
  'ethereum', 'polygon', 'base', 'arbitrum', 'optimism', 'solana',
]);

function normalize(w: WalletInput): WalletInput | null {
  const chain = w.chain?.toLowerCase().trim();
  if (!chain || !NORMALIZED_CHAINS.has(chain)) return null;
  if (!w.address) return null;
  // EVM addresses are case-insensitive — store lowercase. Solana is base58
  // and IS case-sensitive — preserve as-is.
  const address = chain === 'solana' ? w.address : w.address.toLowerCase();
  return { chain, address, custodial: !!w.custodial, isPrimary: !!w.isPrimary };
}

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.get(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!user) return res.status(HttpStatus.NOT_FOUND).end('user not found');

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
  res.json(wallets);
});

handler.post(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!user) return res.status(HttpStatus.NOT_FOUND).end('user not found');

  const incoming: WalletInput[] = Array.isArray(req.body?.wallets) ? req.body.wallets : [];
  const normalized = incoming.map(normalize).filter((w): w is WalletInput => w !== null);

  // Ensure exactly one primary if any wallet is marked primary; otherwise
  // promote the first one. If user has no wallets and isn't sending any,
  // skip — nothing to do.
  if (normalized.length > 0) {
    const hasPrimary = normalized.some((w) => w.isPrimary);
    if (!hasPrimary) normalized[0].isPrimary = true;
    // Drop any extra primaries beyond the first
    let seenPrimary = false;
    for (const w of normalized) {
      if (w.isPrimary && !seenPrimary) {
        seenPrimary = true;
      } else {
        w.isPrimary = false;
      }
    }
  }

  // Run the diff in a transaction so partial sync never leaves an inconsistent state
  const ops: Prisma.PrismaPromise<unknown>[] = [];

  // Upsert each incoming wallet (verifiedAt is set when the client signs SIWE/SIWS;
  // for Privy embedded wallets we trust Privy and set verifiedAt = now.)
  for (const w of normalized) {
    ops.push(
      prisma.wallet.upsert({
        where: { walletIdentity: { chain: w.chain, address: w.address } },
        create: {
          chain: w.chain,
          address: w.address,
          custodial: !!w.custodial,
          isPrimary: !!w.isPrimary,
          verifiedAt: new Date(),
          userId: user.id,
        },
        update: {
          // Only touch fields we know about. Don't move ownership across users.
          isPrimary: !!w.isPrimary,
          custodial: !!w.custodial,
          verifiedAt: new Date(),
        },
      }),
    );
  }

  // Delete wallets we have for this user but Privy no longer reports
  const incomingKeys = new Set(normalized.map((w) => `${w.chain}|${w.address}`));
  const existing = await prisma.wallet.findMany({
    where: { userId: user.id },
    select: { id: true, chain: true, address: true },
  });
  for (const ex of existing) {
    if (!incomingKeys.has(`${ex.chain}|${ex.address}`)) {
      ops.push(prisma.wallet.delete({ where: { id: ex.id } }));
    }
  }

  await prisma.$transaction(ops);

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
  res.json(wallets);
});

export default handler;
