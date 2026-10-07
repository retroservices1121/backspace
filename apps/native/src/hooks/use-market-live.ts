import { useEffect, useState } from 'react';
import { GATE_WS, type BookLevel, type Trade } from '@/lib/gate';

type LiveState = { bid: number | null; ask: number | null; last: number | null; bids: BookLevel[]; asks: BookLevel[]; trades: Trade[]; connected: boolean };
const initial: LiveState = { bid: null, ask: null, last: null, bids: [], asks: [], trades: [], connected: false };

export function useMarketLive(tokenId?: string, conditionId?: string) {
  const [state, setState] = useState(initial);
  useEffect(() => {
    if (!tokenId || !conditionId) return;
    let active = true; const socket = new WebSocket(GATE_WS);
    socket.onopen = () => {
      if (!active) return; setState((current) => ({ ...current, connected: true }));
      const t = Date.now();
      socket.send(JSON.stringify({ t, id: `bbo-${t}`, op: 'subscribe', ch: 'pred.bbo', payload: { items: [{ token_id: tokenId }] } }));
      socket.send(JSON.stringify({ t, id: `depth-${t}`, op: 'subscribe', ch: 'pred.depth', payload: { items: [{ token_id: tokenId, level: 20 }] } }));
      socket.send(JSON.stringify({ t, id: `trades-${t}`, op: 'subscribe', ch: 'pred.trades', payload: { items: [{ condition_id: conditionId }] } }));
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as { ch?: string; result?: Record<string, unknown> }; const result = message.result; if (!result) return;
        if (message.ch === 'pred.bbo') setState((current) => ({ ...current, bid: toNumber(result.bid_px), ask: toNumber(result.ask_px), last: toNumber(result.last_px) }));
        if (message.ch === 'pred.depth') setState((current) => ({ ...current, bids: levels(result.bids), asks: levels(result.asks) }));
        if (message.ch === 'pred.trades') {
          const price = toNumber(result.px); const size = toNumber(result.qty); if (price === null || size === null) return;
          const trade: Trade = { id: `${result.ts}-${result.token_id}-${price}`, outcome: String(result.outcome ?? ''), side: String(result.side ?? ''), price, size, timestamp: toNumber(result.ts) ?? Date.now() };
          setState((current) => ({ ...current, trades: [trade, ...current.trades].slice(0, 30) }));
        }
      } catch { /* Ignore malformed feed messages; REST remains the recovery source. */ }
    };
    socket.onerror = () => setState((current) => ({ ...current, connected: false }));
    socket.onclose = () => setState((current) => ({ ...current, connected: false }));
    return () => { active = false; socket.close(); setState(initial); };
  }, [conditionId, tokenId]);
  return state;
}
function toNumber(value: unknown): number | null { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function levels(value: unknown): BookLevel[] { if (!Array.isArray(value)) return []; return value.flatMap((row) => Array.isArray(row) && row.length >= 2 && toNumber(row[0]) !== null && toNumber(row[1]) !== null ? [{ price: Number(row[0]), size: Number(row[1]) }] : []); }
