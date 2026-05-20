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

// Accepts either a BigInt id (used by PostTokenCard via useToken) or a
// Solana mint address (base58, used by the /tokens/[mint] detail
// route). We BigInt-parse first; if that throws, treat the param as
// a mint and look up by mint instead.
handler.get(async (req, res) => {
  const idStr = req.query.id as string;
  let token = null as Awaited<ReturnType<typeof prisma.token.findUnique>>;
  try {
    const id = BigInt(idStr);
    token = await prisma.token.findUnique({ where: { id } });
  } catch {
    token = await prisma.token.findUnique({ where: { mint: idStr } });
  }
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
