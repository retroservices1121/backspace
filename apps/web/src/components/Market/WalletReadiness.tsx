// Compact trade-gating strip for MarketCard. The market connectors
// (PostMarketCard / CatalogMarketCard) inject this as MarketCard's
// `readinessSlot` so MarketCard itself stays Privy-free.
//
// Renders nothing once the user's trading session is ready; otherwise
// it surfaces what's missing — log in, or run the one-time setup.
//
// Reads the session for whichever signer the connector currently has
// selected. For an existing Polymarket user who picked their linked
// wallet, the on-chain Safe is already deployed + approved, so the
// "Enable trading" path collapses to a single API-creds signature.
import React from 'react';
import Link from 'next/link';

import { usePolymarketSession } from '@src/hooks/usePolymarketSession';
import type { EvmWallet } from '@src/lib/wallet/types';

const STEP_LABEL: Record<string, string> = {
  checking: 'Checking…',
  deploying: 'Deploying wallet…',
  credentials: 'Generating credentials…',
  approvals: 'Approving tokens…',
};

type Props = {
  signerWallet?: EvmWallet | null;
};

export function WalletReadiness({ signerWallet }: Props = {}) {
  const { eoaAddress, isReady, step, error, initialize } =
    usePolymarketSession(signerWallet);

  // Ready to trade — MarketCard's own controls take over.
  if (isReady) return null;

  const busy = step !== 'idle' && step !== 'complete';

  if (!eoaAddress) {
    return (
      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60">
        Log in to trade on this market.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
      <p className="mb-2">
        Set up your trading wallet to place orders — one-time, gasless.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={initialize}
          disabled={busy}
          className="rounded-lg bg-amber-400/80 px-3 py-1 font-semibold text-ink transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? STEP_LABEL[step] ?? 'Setting up…' : 'Enable trading'}
        </button>
        <Link href="/settings/wallet">
          <a className="underline hover:text-amber-50">Fund wallet</a>
        </Link>
      </div>
      {error && <p className="mt-2 text-rose-300">{error.message}</p>}
    </div>
  );
}
