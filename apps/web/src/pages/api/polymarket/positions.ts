// GET /api/polymarket/positions?user={safeAddress}
//
// Thin proxy to Polymarket's Data API, which is the source of truth for
// a user's positions — we do NOT recompute them from our local Trade
// log. The `user` param is the caller's deterministic Gnosis Safe
// address (the proxy wallet that holds collateral + outcome tokens),
// which the client derives from their Privy EOA via deriveSafeAddress.
//
// Auth-gated so only logged-in Backspace users can hit it; the upstream
// data itself is public and keyed purely by address.

import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { DATA_API_URL } from '@src/lib/polymarket/config';
import HttpStatus from 'http-status-codes';

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

const handler = createHandler();

handler.use(requireAuthMiddleware).get(async (req, res) => {
  const user = (req.query.user as string) ?? '';
  if (!ADDRESS_RE.test(user)) {
    res.status(HttpStatus.BAD_REQUEST).json({
      error: 'bad_request',
      message: 'A valid `user` Safe address is required.',
    });
    return;
  }

  try {
    const upstream = await fetch(
      `${DATA_API_URL}/positions?user=${user}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!upstream.ok) {
      res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'upstream_error',
        message: `Polymarket Data API returned ${upstream.status}.`,
      });
      return;
    }
    const positions = await upstream.json();
    // Positions move with the market — never let a proxy response be
    // cached.
    res.setHeader('Cache-Control', 'no-store');
    res.json(positions);
  } catch (e) {
    res.status(HttpStatus.BAD_GATEWAY).json({
      error: 'upstream_unreachable',
      message: e instanceof Error ? e.message : 'Could not reach Polymarket.',
    });
  }
});

export default handler;
