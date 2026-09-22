import { useEffect, useMemo, useState } from 'react';

export type LivePriceMap = Record<string, number | null>;
const WS_URL = 'wss://broker.dexbuilder.com/ws/dex-builder/prediction';

export function useLivePrices(tokenIds: string[]): LivePriceMap {
  const key = tokenIds.slice().filter(Boolean).sort().join(',');
  const ids = useMemo(() => Array.from(new Set(key ? key.split(',') : [])), [key]);
  const [prices, setPrices] = useState<LivePriceMap>({});

  useEffect(() => {
    if (ids.length === 0 || typeof WebSocket === 'undefined') {
      setPrices({});
      return undefined;
    }
    let stopped = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let backoff = 1_000;

    const connect = () => {
      socket = new WebSocket(WS_URL);
      socket.onopen = () => {
        backoff = 1_000;
        socket?.send(JSON.stringify({
          t: Date.now(), id: `bbo-${Date.now()}`, op: 'subscribe', ch: 'pred.bbo',
          payload: { items: ids.map((token_id) => ({ token_id })) },
        }));
      };
      socket.onmessage = (event) => {
        if (typeof event.data !== 'string') return;
        try {
          const message = JSON.parse(event.data) as {
            ch?: string;
            result?: { token_id?: string; bid_px?: string; ask_px?: string; last_px?: string };
          };
          if (message.ch !== 'pred.bbo' || !message.result?.token_id) return;
          const { token_id, bid_px, ask_px, last_px } = message.result;
          const bid = decimal(bid_px);
          const ask = decimal(ask_px);
          const last = decimal(last_px);
          const price = bid != null && ask != null ? (bid + ask) / 2 : bid ?? ask ?? last;
          if (price == null) return;
          setPrices((current) => current[token_id] === price ? current : { ...current, [token_id]: price });
        } catch {
          // Ignore acknowledgements and malformed messages.
        }
      };
      socket.onclose = () => {
        if (stopped) return;
        retry = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 30_000);
      };
      socket.onerror = () => socket?.close();
    };

    setPrices({});
    connect();
    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [key]);
  return prices;
}

function decimal(value: string | undefined): number | null {
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

