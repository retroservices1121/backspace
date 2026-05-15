// POST /api/dflow/swap — server proxy for Dflow's /swap endpoint.
//
// Takes a quoteResponse from the matching /quote call and a Solana
// userPublicKey; returns the base64 swapTransaction the client signs
// + submits with the Privy embedded wallet.
//
// The server injects two things the client must not control:
//   - x-api-key (DFLOW_API_KEY, server-only)
//   - feeAccount (DFLOW_FEE_ACCOUNT — the SPL token account that
//     receives Backspace's platform fee). Without it, no fee is taken.
//
// Body: { userPublicKey: string, quoteResponse: object }
// Returns the upstream Dflow swap JSON verbatim.

import {
  DFLOW_API_BASE,
  dflowApiKey,
  dflowFeeAccount,
} from '@src/lib/dflow/config';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.post(async (req, res) => {
  const apiKey = dflowApiKey();
  if (!apiKey) {
    return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      error: 'dflow_not_configured',
      message: 'DFLOW_API_KEY is not set on the server.',
    });
  }

  const { userPublicKey, quoteResponse } = (req.body ?? {}) as {
    userPublicKey?: string;
    quoteResponse?: unknown;
  };
  if (typeof userPublicKey !== 'string' || !quoteResponse) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 'bad_request',
      message: 'userPublicKey and quoteResponse are required.',
    });
  }

  const body: Record<string, unknown> = { userPublicKey, quoteResponse };
  const feeAccount = dflowFeeAccount();
  if (feeAccount) body.feeAccount = feeAccount;

  const upstream = await fetch(`${DFLOW_API_BASE}/swap`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await upstream.text();
  res.status(upstream.status);
  const contentType = upstream.headers.get('content-type');
  if (contentType) res.setHeader('content-type', contentType);
  return res.send(text);
});

export default handler;
