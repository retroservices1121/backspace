// Live midpoint prices for a set of Polymarket outcome token ids,
// streamed from the CLOB market-channel websocket (priceSocket).
//
// Returns a map of tokenId -> midpoint (0..1) or null when not yet
// known. The market cards overlay this on top of the cron-cached
// price so the displayed number tracks the order book in real time.

import { useEffect, useState } from 'react';

import { priceSocket } from '@src/lib/polymarket/priceSocket';

export type LivePriceMap = Record<string, number | null>;

export function useLivePrices(tokenIds: string[]): LivePriceMap {
  // Stable, order-independent key so the effect only re-subscribes
  // when the set of tokens actually changes — not on every render.
  const key = tokenIds.slice().sort().join(',');
  const [prices, setPrices] = useState<LivePriceMap>({});

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    if (ids.length === 0) {
      setPrices({});
      return undefined;
    }

    const read = () => {
      setPrices((prev) => {
        let changed = Object.keys(prev).length !== ids.length;
        const next: LivePriceMap = {};
        for (const id of ids) {
          next[id] = priceSocket.getPrice(id);
          if (prev[id] !== next[id]) changed = true;
        }
        return changed ? next : prev;
      });
    };

    const unsubscribe = priceSocket.subscribe(ids, read);
    read(); // seed with whatever's already cached on the socket
    return unsubscribe;
  }, [key]);

  return prices;
}
