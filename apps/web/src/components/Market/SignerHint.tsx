// Passive disclosure: "Signing from <wallet>" caption shown above the
// trade controls when the user's auto-selected signer is a linked
// external wallet. Embedded-only users see nothing.
//
// Why: trades from a linked wallet pop the user's MetaMask / Coinbase
// Wallet app for the signature. Without disclosure, that popup is a
// surprise. A one-line muted caption is enough — we don't need a
// picker, just a heads-up.

import React from 'react';

import type { EvmWallet } from '@src/lib/wallet/types';

type Props = {
  wallet: EvmWallet | null;
};

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// Same mapping as the old SignerPicker — kept inline because there's
// only one consumer now and the list is short.
function labelFor(w: EvmWallet): string {
  const t = (w.clientType ?? '').toLowerCase();
  if (t === 'metamask') return 'MetaMask';
  if (t === 'coinbase_wallet') return 'Coinbase Wallet';
  if (t === 'walletconnect') return 'WalletConnect';
  if (t === 'rainbow') return 'Rainbow';
  if (t === 'phantom') return 'Phantom';
  if (t.length === 0) return 'External wallet';
  return t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ');
}

export function SignerHint({ wallet }: Props) {
  // Embedded or missing wallet — no surprise to disclose.
  if (!wallet || wallet.source !== 'external') return null;

  return (
    <div className="mt-2 text-[11px] font-mono text-ink-3">
      Signing from {labelFor(wallet)}{' '}
      <span className="text-ink-4">{shortAddress(wallet.address)}</span>
    </div>
  );
}
