// DELETE /api/users/me/linked-wallets/[id]
//
// Soft-unlink a wallet from the caller's account. We keep the Wallet
// row (Trade and Position FKs reference it) but clear the
// `linked-polymarket` source marker so:
//   - the wallet drops out of the /settings/wallet list
//   - the auto-sync effect in useLinkedWallets no longer re-adds it
//   - prior trades and positions remain intact for audit + accuracy
//
// The client is expected to call Privy's unlinkWallet(address) BEFORE
// this endpoint — otherwise Privy still reports the wallet as linked
// and the auto-sync POST would re-flag it on the next render.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.delete(async (req, res) => {
  const idRaw = req.query.id;
  if (typeof idRaw !== 'string') {
    return res.status(HttpStatus.BAD_REQUEST).end('missing id');
  }
  let id: bigint;
  try {
    id = BigInt(idRaw);
  } catch {
    return res.status(HttpStatus.BAD_REQUEST).end('invalid id');
  }

  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end('user not found');

  const wallet = await prisma.wallet.findUnique({
    where: { id },
    select: { id: true, userId: true, source: true },
  });
  if (!wallet
    || wallet.userId !== me.id
    || wallet.source !== 'linked-polymarket') {
    return res.status(HttpStatus.NOT_FOUND).end('wallet not found');
  }

  await prisma.wallet.update({
    where: { id },
    data: { source: null, verifiedAt: null },
  });

  return res.json({ ok: true });
});

export default handler;
