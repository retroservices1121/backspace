// Mobile trade-slip bottom sheet (Backspace_Mobile_App prototype
// screen 4). The mobile buy surface for the market detail page —
// replaces the inline buy panel below sm. Pure presentation + a slim
// amount/quick-chip model; the actual order routes through the SAME
// useTrade.handleTrade the caller already owns (passed in via
// onConfirm), so there's one trade path, not two.
//
// Honest accounting (matches useTrade's USD model): the user types a
// USD amount; shares = amount / price, max payout = shares (each share
// settles at $1 if the side wins). Slippage/fees aren't modeled client-
// side, so we don't show a fake slippage line.

import React, { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  side: 'YES' | 'NO';
  question: string;
  /** The side's current price in percent (e.g. 62 → $0.62/share). */
  pricePct: number;
  amount: string;
  onAmountChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  walletConnected: boolean;
  balanceUsd?: number | null;
};

const QUICK = [
  { label: '$25', value: '25' },
  { label: '$100', value: '100' },
  { label: '$250', value: '250' },
  { label: '$1k', value: '1000' },
];

const TradeSlipSheet: React.FC<Props> = ({
  open, side, question, pricePct, amount, onAmountChange,
  onConfirm, onClose, walletConnected, balanceUsd,
}) => {
  // Mount-then-raise so the sheet slides up on open without needing a
  // keyframes entry in the tailwind config.
  const [raised, setRaised] = useState(false);
  useEffect(() => {
    if (!open) {
      setRaised(false);
      return undefined;
    }
    const id = requestAnimationFrame(() => setRaised(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;

  const price = pricePct / 100;
  const numericAmount = Number(amount) || 0;
  const shares = price > 0 ? numericAmount / price : 0;
  const maxPayout = shares; // each share settles at $1 if the side wins
  const isYes = side === 'YES';

  return (
    // Mobile-only: the desktop detail page keeps its inline buy panel.
    <div className="sm:hidden fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: raised ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="
          absolute inset-x-0 bottom-0
          bg-surface border-t border-line-2
          rounded-t-[24px]
          transition-transform duration-300 ease-out
          font-display text-ink
        "
        style={{
          transform: raised ? 'translateY(0)' : 'translateY(100%)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Grabber */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-[5px] rounded-full bg-white/20" />

        {/* Header */}
        <div className="px-[18px] pt-6 pb-3.5 border-b border-line flex items-center gap-3">
          <span
            className={[
              'px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold tracking-[0.1em] flex-none',
              isYes
                ? 'bg-green-vivid/15 text-green-2 border border-green-vivid/35'
                : 'bg-pink-vivid/10 text-pink-2 border border-pink-vivid/25',
            ].join(' ')}
          >
            BUY {side}
          </span>
          <h3 className="m-0 flex-1 text-[15px] font-semibold leading-[1.3] tracking-[-0.005em] line-clamp-2">
            {question}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-full bg-white/5 flex items-center justify-center text-ink flex-none"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Amount */}
        <div className="px-[18px] py-6 flex flex-col items-center border-b border-line">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 font-semibold mb-1.5">
            Order amount
          </div>
          <label className="flex items-baseline gap-1 cursor-text">
            <span className="text-[24px] text-ink-3 font-medium">$</span>
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="
                w-[7ch] bg-transparent outline-none border-0 p-0
                text-[54px] font-bold tracking-[-0.03em] leading-none tabular-nums text-ink
              "
            />
          </label>
          <div className="mt-1.5 text-[12px] text-ink-3 font-mono tracking-[0.04em]">
            {shares > 0
              ? `Buying ${shares.toFixed(0)} shares @ ${price.toFixed(2)}`
              : `Price ${price.toFixed(2)} / share`}
          </div>
        </div>

        {/* Quick amounts */}
        <div className="px-4 py-3 flex gap-2 border-b border-line">
          {QUICK.map((q) => {
            const on = amount === q.value;
            return (
              <button
                type="button"
                key={q.value}
                onClick={() => onAmountChange(q.value)}
                className={[
                  'flex-1 h-10 rounded-[9px] font-mono text-[13px] font-semibold tracking-[0.02em] border',
                  on
                    ? 'bg-brand-soft border-brand-2 text-ink'
                    : 'bg-surface-2 border-line text-ink-2',
                ].join(' ')}
              >
                {q.label}
              </button>
            );
          })}
          {balanceUsd != null && balanceUsd > 0 && (
            <button
              type="button"
              onClick={() => onAmountChange(String(Math.floor(balanceUsd)))}
              className="flex-1 h-10 rounded-[9px] font-mono text-[13px] font-semibold tracking-[0.02em] border bg-surface-2 border-line text-ink-2"
            >
              MAX
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="px-[18px] py-3.5 flex flex-col gap-2">
          <SummaryRow label="Avg. price" value={price.toFixed(2)} />
          <SummaryRow label="Shares" value={shares > 0 ? shares.toFixed(0) : '—'} />
          <div className="flex justify-between text-[14px] font-mono">
            <span className="text-ink-3">If {side} resolves · max payout</span>
            <b className="text-green-2 text-[16px] font-semibold">
              ${maxPayout > 0 ? maxPayout.toFixed(0) : '0'}
            </b>
          </div>
        </div>

        {/* Confirm */}
        <div className="px-4 pt-3.5 pb-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!walletConnected || numericAmount <= 0}
            className="
              w-full h-[54px] rounded-[14px]
              bg-green-vivid text-ink font-semibold text-[16px] tracking-[-0.005em]
              flex items-center justify-center gap-2
              hover:brightness-110 transition
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100
            "
          >
            Buy {side} · ${numericAmount > 0 ? numericAmount : 0}
          </button>
          <div className="mt-2.5 text-center font-mono text-[10px] tracking-[0.08em] text-ink-3">
            {walletConnected
              ? 'Orders route to Polymarket · settled in USDC'
              : 'Set up your trading wallet to place orders'}
          </div>
        </div>
      </div>
    </div>
  );
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[12.5px] font-mono tracking-[0.02em] text-ink-3">
      <span>{label}</span>
      <b className="text-ink font-medium">{value}</b>
    </div>
  );
}

export default TradeSlipSheet;
