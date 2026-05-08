import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.patch(async (req, res) => {
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

  await prisma.$transaction([
    prisma.wallet.updateMany({
      where: { userId: user.id, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.wallet.update({
      where: { id: walletId },
      data: { isPrimary: true },
    }),
  ]);

  res.json({ ok: true });
});

export default handler;
