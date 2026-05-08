// Visual sandbox for MarketCard. Mocked data, not wired to any venue.
// Visit /demo/market to see the component in isolation.

import { MarketCard, MarketCardData } from '@src/components/Market/MarketCard';
import { useState } from 'react';

const MOCK_BINARY: MarketCardData = {
  venue: 'POLYMARKET',
  externalId: 'mock-binary-1',
  question: 'Will the next U.S. president be a Democrat?',
  category: 'Politics',
  imageUrl: null,
  closesAt: new Date(Date.now() + 14 * 86_400_000),
  outcomes: [
    { externalId: 'yes', label: 'Yes', lastPrice: '0.42', lastPriceAt: new Date() },
    { externalId: 'no',  label: 'No',  lastPrice: '0.58', lastPriceAt: new Date() },
  ],
};

const MOCK_MULTI: MarketCardData = {
  venue: 'POLYMARKET',
  externalId: 'mock-multi-1',
  question: 'Which team wins the next NBA championship?',
  category: 'Sports',
  imageUrl: null,
  closesAt: new Date(Date.now() + 90 * 86_400_000),
  outcomes: [
    { externalId: 'celtics', label: 'Celtics', lastPrice: '0.31', lastPriceAt: new Date() },
    { externalId: 'thunder', label: 'Thunder', lastPrice: '0.27', lastPriceAt: new Date() },
    { externalId: 'nuggets', label: 'Nuggets', lastPrice: '0.18', lastPriceAt: new Date() },
    { externalId: 'other',   label: 'Field',   lastPrice: '0.24', lastPriceAt: new Date() },
  ],
};

export default function MarketDemo() {
  const [walletConnected, setWalletConnected] = useState(false);

  function fakeTrade(intent: { outcomeExternalId: string; side: 'BUY' | 'SELL'; shares: string }) {
    // eslint-disable-next-line no-console
    console.log('mock trade intent', intent);
    return new Promise<void>((r) => setTimeout(r, 600));
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] p-8 text-white">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">MarketCard sandbox</h1>
          <button
            onClick={() => setWalletConnected((v) => !v)}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs"
          >
            {walletConnected ? 'Disconnect wallet' : 'Connect wallet (mock)'}
          </button>
        </div>

        <p className="mb-4 text-sm text-white/50">
          Mocked data, no real venue. Toggle the wallet connection above to see how the
          CTA changes. Submitting in connected mode logs the trade intent to the console.
        </p>

        <MarketCard
          market={MOCK_BINARY}
          walletConnected={walletConnected}
          walletBalanceUsd={walletConnected ? '124.50' : null}
          onTrade={fakeTrade}
        />

        <MarketCard
          market={MOCK_MULTI}
          walletConnected={walletConnected}
          walletBalanceUsd={walletConnected ? '124.50' : null}
          onTrade={fakeTrade}
        />
      </div>
    </div>
  );
}
