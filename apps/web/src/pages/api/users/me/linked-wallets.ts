// /api/users/me/linked-wallets
//
// POST  — register an external EOA the caller has just linked via
//         Privy's `useLinkAccount().linkWallet()`. Privy already
//         verified ownership (the user signed from the wallet) — we
//         just persist the address against their User so the
//         snapshot worker, profile, and portfolio can pick it up.
//         Also pre-computes the Polymarket Gnosis Safe address and
//         caches it on the row.
//
// GET   — list the caller's currently linked external wallets.
//
// We DO NOT trust the request body's `address` blindly — we re-read
// the caller's linked accounts from Privy via the server SDK to
// confirm. Without that step a malicious client could attach
// someone else's wallet address to their handle.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { deriveSafeAddress } from '@src/lib/polymarket';
import { getPrivyExternalWalletsById } from '@backspace/auth';
import HttpStatus from 'http-status-codes';

const PRIVY_CFG = {
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
};

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.post(async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end('user not found');

  let externalWallets: string[];
  try {
    // req.authId is the verified Privy DID (set by nextconnect
    // middleware). Calling Privy's user-lookup API by DID gives us
    // the authoritative list of attached wallets — the access-token
    // claims don't carry linkedAccounts.
    externalWallets = await getPrivyExternalWalletsById(req.authId, PRIVY_CFG);
  } catch (err) {
    return res.status(HttpStatus.BAD_GATEWAY).json({
      error: 'privy_unavailable',
      message: (err as Error).message,
    });
  }

  // The body's `address` (if any) is treated as a hint — we only
  // record what Privy actually says is linked. This is the security
  // guarantee: a client cannot make us record an address they don't
  // control.
  const claimedAddress = ((req.body as { address?: string })?.address ?? '').toLowerCase();
  const verified = externalWallets.map((a) => a.toLowerCase());
  const toRecord = claimedAddress && verified.includes(claimedAddress)
    ? [claimedAddress]
    // No specific address → sync the whole set. Useful for a "refresh
    // my linked accounts" flow.
    : verified;

  if (toRecord.length === 0) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 'no_linked_wallet',
      message: 'No external wallet is linked to your Privy account.',
    });
  }

  const results = [];
  for (const address of toRecord) {
    const safeAddress = (() => {
      try {
        return deriveSafeAddress(address);
      } catch {
        return null;
      }
    })();
    const wallet = await prisma.wallet.upsert({
      where: { walletIdentity: { chain: 'polygon', address } },
      create: {
        chain: 'polygon',
        address,
        custodial: false,
        source: 'linked-polymarket',
        safeAddress,
        verifiedAt: new Date(),
        userId: me.id,
      },
      update: {
        // Refresh on re-link without flipping ownership: only update
        // if the row already belongs to the caller.
        ...(safeAddress ? { safeAddress } : {}),
        verifiedAt: new Date(),
      },
      select: { id: true, userId: true, address: true, safeAddress: true },
    });
    if (wallet.userId !== me.id) {
      // Address already attached to a different user. Don't reveal
      // which — just skip silently.
      continue;
    }
    results.push({
      id: wallet.id.toString(),
      address: wallet.address,
      safeAddress: wallet.safeAddress,
    });
  }

  return res.status(HttpStatus.CREATED).json({ linked: results });
});

handler.get(async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end('user not found');

  const wallets = await prisma.wallet.findMany({
    where: {
      userId: me.id,
      source: 'linked-polymarket',
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, address: true, safeAddress: true, createdAt: true },
  });
  return res.json(
    wallets.map((w) => ({
      id: w.id.toString(),
      address: w.address,
      safeAddress: w.safeAddress,
      linkedAt: w.createdAt,
    })),
  );
});

export default handler;
