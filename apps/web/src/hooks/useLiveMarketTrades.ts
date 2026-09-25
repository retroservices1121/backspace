import { useEffect, useState } from 'react';

const WS_URL = 'wss://broker.dexbuilder.com/ws/dex-builder/prediction';

export type LiveMarketTrade = {
  id: string;
  token_id?: string;
  outcome?: string;
  side?: string;
  price?: string;
  size?: string;
  created_at?: number;
};

export function useLiveMarketTrades(conditionId?: string | null) {
  const [trades, setTrades] = useState<LiveMarketTrade[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setTrades([]);
    setConnected(false);
    if (!conditionId || typeof WebSocket === 'undefined') return undefined;

    let stopped = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let backoff = 1_000;

    const connect = () => {
      socket = new WebSocket(WS_URL);
      socket.onopen = () => {
        backoff = 1_000;
        socket?.send(JSON.stringify({
          t: Date.now(),
          id: `trades-${Date.now()}`,
          op: 'subscribe',
          ch: 'pred.trades',
          payload: { items: [{ condition_id: conditionId }] },
        }));
      };
      socket.onmessage = (event) => {
        if (typeof event.data !== 'string') return;
        try {
          const message = JSON.parse(event.data) as {
            ch?: string;
            err?: unknown;
            result?: {
              condition_id?: string;
              token_id?: string;
              outcome?: string;
              side?: string;
              px?: string;
              qty?: string;
              ts?: number;
              status?: string;
            };
          };
          if (message.ch === 'pred.trades' && message.result?.status === 'success' && !message.err) {
            setConnected(true);
            return;
          }
          if (message.ch !== 'pred.trades' || message.result?.condition_id !== conditionId) return;
          setConnected(true);
          const result = message.result;
          const trade: LiveMarketTrade = {
            id: [conditionId, result.token_id, result.ts, result.side, result.px, result.qty].join(':'),
            token_id: result.token_id,
            outcome: result.outcome,
            side: result.side,
            price: result.px,
            size: result.qty,
            created_at: result.ts,
          };
          setTrades((current) => current.some((item) => item.id === trade.id)
            ? current
            : [trade, ...current].slice(0, 40));
        } catch {
          // Ignore unrelated acknowledgements and malformed messages.
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
  }, [conditionId]);

  return { trades, connected };
}
