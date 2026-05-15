// GET /api/tokens/[id] — single token lookup for PostTokenCard.
//
// Auth-gated for parity with the rest of the signed-in app. The
// response shape matches the list endpoint's element shape so the
// client can treat them interchangeably.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.get(async (req, res) => {
  const idStr = req.query.id as string;
  let id: bigint;
  try {
    id = BigInt(idStr);
  } catch {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'bad_id' });
  }

  const token = await prisma.token.findUnique({ where: { id } });
  if (!token || !token.isActive) {
    return res.status(HttpStatus.NOT_FOUND).end();
  }

  return res.json({
    id: token.id.toString(),
    mint: token.mint,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.logoURI,
  });
});

export default handler;
