// The authenticated CLOB client used for all order operations.
//
// signatureType 2 (POLY_GNOSIS_SAFE) = an EOA signer that owns a
// Gnosis Safe proxy; funderAddress is that Safe (it holds the pUSD and
// outcome tokens). builderConfig carries our builderCode so orders are
// attributed to the Backspace builder profile.
import {
  ClobClient,
  SignatureTypeV2,
  type ApiKeyCreds,
} from '@polymarket/clob-client-v2';
import type { providers } from 'ethers';

import { builderCode, CLOB_API_URL, POLYGON_CHAIN_ID } from './config';

export function buildClobClient(args: {
  signer: providers.JsonRpcSigner;
  creds: ApiKeyCreds;
  funderAddress: string;
}): ClobClient {
  const code = builderCode();
  return new ClobClient({
    host: CLOB_API_URL,
    chain: POLYGON_CHAIN_ID,
    signer: args.signer,
    creds: args.creds,
    signatureType: SignatureTypeV2.POLY_GNOSIS_SAFE,
    funderAddress: args.funderAddress,
    builderConfig: code ? { builderCode: code } : undefined,
  });
}
