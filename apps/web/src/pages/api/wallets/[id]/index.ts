import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.delete(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!user) return res.status(HttpStatus.NOT_FOUND).end();

  const walletId = BigInt(req.query.id as string);
  const target = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!target || target.userId !== user.id) {
    return res.status(HttpStatus.NOT_FOUND).end();
  }

  // Refuse to delete a wallet that has settled positions; user must wind those
  // down via the venue first. This protects the position/trade audit trail.
  const positions = await prisma.position.count({
    where: { walletId, NOT: { settledAt: null } },
  });
  if (positions > 0) {
    return res.status(HttpStatus.CONFLICT).json({
      error: 'Wallet has settled positions; cannot remove.',
    });
  }

  await prisma.wallet.delete({ where: { id: walletId } });
  res.json({ ok: true });
});

export default handler;
