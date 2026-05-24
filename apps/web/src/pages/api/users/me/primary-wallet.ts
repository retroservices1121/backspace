// /api/users/me/primary-wallet
//
// GET  — return the caller's primary trading wallet address (or null).
// POST — set it. Body: { address: string | null }. Setting null clears
//        the preference and falls back to auto-pick in useEvmTradeSigner.
//
// We don't validate that the address belongs to one of the caller's
// linked wallets. If they pick a stale address, useEvmTradeSigner
// silently falls back to auto-pick — the user's picker UI is the
// source of truth for what's selectable, not the server.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.get(async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { primaryTradingWalletAddress: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end();
  return res.json({ address: me.primaryTradingWalletAddress });
});

handler.post(async (req, res) => {
  const raw = (req.body as { address?: string | null })?.address;
  const address = typeof raw === 'string' && raw.trim().length > 0
    ? raw.trim().toLowerCase()
    : null;

  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end();

  await prisma.user.update({
    where: { id: me.id },
    data: { primaryTradingWalletAddress: address },
  });
  return res.json({ address });
});

export default handler;
