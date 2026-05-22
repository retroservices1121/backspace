// Wallet picker chip that lives in MarketCard's readinessSlot. Users
// who've linked an external wallet (e.g. their existing Polymarket
// wallet) can choose to trade from it directly — same Safe, same
// position history, no funding bridge.
//
// Renders nothing when the user has a single wallet (embedded only)
// so the typical-case UI is unchanged. The dropdown appears only when
// there's an actual choice to make.

import React, { useEffect, useRef, useState } from 'react';

import type { EvmWallet } from '@src/lib/wallet/types';

type Props = {
  candidates: EvmWallet[];
  selected: EvmWallet | null;
  onSelect: (w: EvmWallet) => void;
};

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// Map Privy's wallet-client identifiers to display names. Embedded
// always reads "Backspace wallet" regardless of provider so the
// branding stays consistent post-CDP migration.
function labelFor(w: EvmWallet): string {
  if (w.source === 'embedded') return 'Backspace wallet';
  const t = (w.clientType ?? '').toLowerCase();
  if (t === 'metamask') return 'MetaMask';
  if (t === 'coinbase_wallet') return 'Coinbase Wallet';
  if (t === 'walletconnect') return 'WalletConnect';
  if (t === 'rainbow') return 'Rainbow';
  if (t === 'phantom') return 'Phantom';
  // Title-case anything else.
  if (t.length === 0) return 'External wallet';
  return t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ');
}

export function SignerPicker({ candidates, selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click — standard dropdown discipline.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current && !ref.current.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // One wallet = no decision to make; keep the trade UI clean.
  if (candidates.length <= 1) return null;

  const current = selected ?? candidates[0];

  return (
    <div className="mt-3" ref={ref}>
      <label className="block text-[11px] uppercase tracking-widest text-white/40 mb-1">
        Signing wallet
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="
            w-full flex items-center justify-between rounded-xl
            border border-white/10 bg-black/30 px-3 py-2
            text-sm text-white hover:border-white/20
            transition-colors duration-150
          "
        >
          <span className="flex items-baseline gap-2 min-w-0">
            <span className="truncate">{labelFor(current)}</span>
            {current.source !== 'embedded' && (
              <span className="text-[11px] font-mono text-white/40 shrink-0">
                {shortAddress(current.address)}
              </span>
            )}
          </span>
          <svg
            viewBox="0 0 24 24" width="12" height="12"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-white/40 shrink-0"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div
            className="
              absolute z-20 mt-1 w-full
              rounded-xl border border-white/10 bg-surface
              shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] p-1.5
            "
          >
            {candidates.map((w) => {
              const active = w.address === current.address;
              return (
                <button
                  key={w.address}
                  type="button"
                  onClick={() => {
                    onSelect(w);
                    setOpen(false);
                  }}
                  className={[
                    'w-full text-left px-2.5 py-2 rounded-lg',
                    'transition-colors duration-150',
                    active ? 'bg-brand-soft' : 'hover:bg-white/5',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'text-[13px] font-semibold',
                      active ? 'text-brand-2' : 'text-white',
                    ].join(' ')}
                  >
                    {labelFor(w)}
                  </div>
                  <div className="text-[11px] font-mono text-white/40">
                    {w.source === 'embedded'
                      ? 'Backspace-managed · ready'
                      : shortAddress(w.address)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
