// V2 contract addresses, sourced from the SDKs (the source of truth)
// rather than hardcoded. clob-client-v2 provides the trading +
// collateral contracts (incl. pUSD); builder-relayer-client provides
// the Safe factory used to derive each user's proxy wallet.
//
// builder-relayer-client doesn't re-export getContractConfig from its
// root, hence the deep import — the package ships no `exports` map so
// this resolves fine. clob-client-v2 IS exports-restricted, so its
// getContractConfig comes from the package root.
import { getContractConfig as getClobContractConfig } from '@polymarket/clob-client-v2';
import { getContractConfig as getRelayerContractConfig } from '@polymarket/builder-relayer-client/dist/config';

import { POLYGON_CHAIN_ID } from './config';

// { exchange, negRiskAdapter, negRiskExchange, collateral,
//   conditionalTokens, exchangeV2, negRiskExchangeV2 }
// `collateral` is pUSD on V2; `*V2` are the CLOB V2 exchanges.
export function clobContracts() {
  return getClobContractConfig(POLYGON_CHAIN_ID);
}

// { ProxyContracts, SafeContracts: { SafeFactory, SafeMultisend }, ... }
export function relayerContracts() {
  return getRelayerContractConfig(POLYGON_CHAIN_ID);
}
