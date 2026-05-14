// POST /api/polymarket/sign
//
// Remote signing endpoint for Polymarket's gasless Relayer. The client
// (lib/polymarket/relayClient.ts) builds a RelayClient with a
// BuilderConfig that points its `remoteBuilderConfig.url` here; the
// RelayClient then POSTs { method, path, body } whenever it needs
// builder HMAC headers (Safe deploy + token approvals).
//
// In CLOB V2 the per-order `builderCode` field handles order
// attribution with no signing — but the Relayer still authenticates
// with the HMAC builder key, so this endpoint stays.
//
// The builder HMAC secret is server-only and never reaches the
// browser. The route is auth-gated so only logged-in Backspace users
// can mint relayer headers.
import { buildHmacSignature } from '@polymarket/builder-signing-sdk';
import { builderHmacCreds } from '@src/lib/polymarket/config';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();

handler.use(requireAuthMiddleware).post(async (req, res) => {
  const creds = builderHmacCreds();
  if (!creds) {
    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      error: 'builder_not_configured',
      message: 'Polymarket builder credentials are not set on the server.',
    });
    return;
  }

  const { method, path, body } = (req.body ?? {}) as {
    method?: string;
    path?: string;
    body?: string;
  };
  if (typeof method !== 'string' || typeof path !== 'string') {
    res.status(HttpStatus.BAD_REQUEST).json({
      error: 'bad_request',
      message: 'method and path are required.',
    });
    return;
  }

  const timestamp = Date.now();
  const signature = buildHmacSignature(
    creds.secret,
    timestamp,
    method,
    path,
    typeof body === 'string' ? body : undefined,
  );

  res.json({
    POLY_BUILDER_API_KEY: creds.key,
    POLY_BUILDER_PASSPHRASE: creds.passphrase,
    POLY_BUILDER_TIMESTAMP: timestamp.toString(),
    POLY_BUILDER_SIGNATURE: signature,
  });
});

export default handler;
