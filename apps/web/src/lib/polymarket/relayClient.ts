// Polymarket gasless Relayer client. Used for Safe deployment and the
// token-approval batch. Authenticates with the builder HMAC creds via
// the remote signing endpoint (/api/polymarket/sign) — the secret
// stays server-side; this BuilderConfig only holds the endpoint URL.
import { RelayClient } from '@polymarket/builder-relayer-client';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import type { providers } from 'ethers';

import { POLYGON_CHAIN_ID, RELAYER_URL } from './config';

function remoteSigningUrl(): string {
  return typeof window !== 'undefined'
    ? `${window.location.origin}/api/polymarket/sign`
    : '/api/polymarket/sign';
}

export function buildRelayClient(
  signer: providers.JsonRpcSigner,
): RelayClient {
  const builderConfig = new BuilderConfig({
    remoteBuilderConfig: { url: remoteSigningUrl() },
  });
  return new RelayClient(
    RELAYER_URL,
    POLYGON_CHAIN_ID,
    signer,
    builderConfig,
  );
}
