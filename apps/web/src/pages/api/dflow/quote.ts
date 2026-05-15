// GET /api/dflow/quote — server proxy for Dflow's /quote endpoint.
//
// Dflow requires an x-api-key on every call (issued by hello@dflow.net).
// Routing every quote through this proxy keeps the key out of the client
// bundle and lets us enforce platform-fee params consistently — the
// client cannot omit or alter the bps cut.
//
// Query: inputMint, outputMint, amount, slippageBps (optional, default 50)
// Returns the upstream Dflow quote JSON verbatim.

import {
  DFLOW_API_BASE,
  dflowApiKey,
  platformFeeBps,
} from '@src/lib/dflow/config';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.get(async (req, res) => {
  const apiKey = dflowApiKey();
  if (!apiKey) {
    return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      error: 'dflow_not_configured',
      message: 'DFLOW_API_KEY is not set on the server.',
    });
  }

  const { inputMint, outputMint, amount, slippageBps } = req.query as {
    inputMint?: string;
    outputMint?: string;
    amount?: string;
    slippageBps?: string;
  };
  if (!inputMint || !outputMint || !amount) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 'bad_request',
      message: 'inputMint, outputMint, and amount are required.',
    });
  }

  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: slippageBps ?? '50',
  });
  // Always set the platform fee server-side so the client can't strip it.
  // Mode = outputMint means the fee comes out of what the user receives.
  const fee = platformFeeBps();
  if (fee > 0) {
    params.set('platformFeeBps', String(fee));
    params.set('platformFeeMode', 'outputMint');
  }

  const upstream = await fetch(`${DFLOW_API_BASE}/quote?${params.toString()}`, {
    headers: { 'x-api-key': apiKey },
  });
  const text = await upstream.text();
  // Mirror upstream content-type & body so client errors stay actionable.
  res.status(upstream.status);
  const contentType = upstream.headers.get('content-type');
  if (contentType) res.setHeader('content-type', contentType);
  return res.send(text);
});

export default handler;
