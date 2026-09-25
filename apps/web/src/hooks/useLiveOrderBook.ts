import { useEffect, useState } from 'react';

const WS_URL = 'wss://broker.dexbuilder.com/ws/dex-builder/prediction';

export type LiveOrderBook = {
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number | null;
};

export function useLiveOrderBook(tokenId?: string | null, level: 5 | 10 | 20 | 50 = 20) {
  const [book, setBook] = useState<LiveOrderBook | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setBook(null);
    setConnected(false);
    if (!tokenId || typeof WebSocket === 'undefined') return undefined;

    let stopped = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let backoff = 1_000;

    const connect = () => {
      socket = new WebSocket(WS_URL);
      socket.onopen = () => {
        backoff = 1_000;
        setConnected(true);
        socket?.send(JSON.stringify({
          t: Date.now(),
          id: `depth-${Date.now()}`,
          op: 'subscribe',
          ch: 'pred.depth',
          payload: { items: [{ token_id: tokenId, level }] },
        }));
      };
      socket.onmessage = (event) => {
        if (typeof event.data !== 'string') return;
        try {
          const message = JSON.parse(event.data) as {
            ch?: string;
            result?: {
              token_id?: string;
              bids?: unknown;
              asks?: unknown;
              ts?: number;
            };
          };
          if (message.ch !== 'pred.depth' || message.result?.token_id !== tokenId) return;
          const timestamp = message.result.ts;
          setBook({
            bids: levels(message.result.bids),
            asks: levels(message.result.asks),
            timestamp: typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp : null,
          });
        } catch {
          // Subscription acknowledgements do not contain depth data.
        }
      };
      socket.onclose = () => {
        setConnected(false);
        if (stopped) return;
        retry = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 30_000);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      stopped = true;
      setConnected(false);
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [tokenId, level]);

  return { book, connected };
}

function levels(value: unknown): [string, string][] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((level) => {
    if (!Array.isArray(level) || level.length < 2) return [];
    const price = String(level[0]);
    const size = String(level[1]);
    return Number.isFinite(Number(price)) && Number.isFinite(Number(size))
      ? [[price, size] as [string, string]]
      : [];
  });
}
