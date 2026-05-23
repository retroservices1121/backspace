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

  // Linked external wallets typically already have a deployed Safe +
  // token approvals from polymarket.com — the only setup step left is
  // deriving backspace.to-scoped Polymarket L2 API creds (one
  // signature). Embedded wallets need the full path. Copy reads the
  // same in both cases because the user-visible step is identical:
  // approve in your wallet.
  const isExternal = signerWallet?.source === 'external';
  const body = isExternal
    ? 'Sign once in your Backspace wallet to enable gasless trading.'
    : 'Set up your trading wallet to place orders — one-time, gasless.';

  return (
    <div className="mt-3 rounded-xl border border-brand-2/30 bg-brand-soft px-3 py-2 text-xs text-ink/90">
      <p className="mb-2">{body}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={initialize}
          disabled={busy}
          className="rounded-lg bg-brand px-3 py-1 font-semibold text-ink transition hover:bg-brand-2 shadow-[0_8px_22px_-6px_rgba(88,34,251,0.55)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {busy ? STEP_LABEL[step] ?? 'Setting up…' : 'Enable trading'}
        </button>
        <Link href="/settings/wallet">
          <a className="underline hover:text-brand-2">Fund wallet</a>
        </Link>
      </div>
      {error && <p className="mt-2 text-rose-300">{error.message}</p>}
    </div>
  );
}
