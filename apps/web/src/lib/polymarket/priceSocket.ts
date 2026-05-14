// Live price feed from Polymarket's CLOB market-channel websocket.
//
// The catalog importer gives us markets + a cron-stale price; this
// gives the *current* price. Browser-only, native WebSocket, no auth —
// the market channel is public.
//
// One shared connection for the whole app. Cards register the outcome
// token ids they care about via subscribe(); the manager keeps a
// best-bid/ask map per token and exposes the midpoint as the display
// price. Events handled: book (snapshot on subscribe), best_bid_ask,
// price_change, last_trade_price.
//
// Subscription note: we send the full union of referenced token ids on
// every change and never send an explicit unsubscribe — a few stale
// streams cost negligible bandwidth, and it avoids depending on the
// exact incremental-op shape. When nothing is referenced, the socket
// closes entirely.

import { CLOB_WS_URL } from './config';

type Best = { bid?: number; ask?: number; lastTrade?: number };
type Listener = () => void;

const PING_INTERVAL_MS = 10_000;
const RESUBSCRIBE_DEBOUNCE_MS = 300;
const NOTIFY_THROTTLE_MS = 150;
const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

function num(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
}

// bids/asks are [{ price, size }] — best bid is the highest price,
// best ask the lowest. Don't assume the array is sorted.
function topOfBook(levels: unknown, kind: 'bid' | 'ask'): number | undefined {
  if (!Array.isArray(levels)) return undefined;
  let best: number | undefined;
  for (const lvl of levels) {
    const p = num((lvl as { price?: unknown })?.price);
    if (p == null) continue;
    if (best == null) best = p;
    else best = kind === 'bid' ? Math.max(best, p) : Math.min(best, p);
  }
  return best;
}

class PriceSocket {
  private ws: WebSocket | null = null;

  private best = new Map<string, Best>();

  // token id -> number of live subscribers
  private refs = new Map<string, number>();

  private listeners = new Set<Listener>();

  private pingTimer: ReturnType<typeof setInterval> | null = null;

  private resubTimer: ReturnType<typeof setTimeout> | null = null;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private notifyTimer: ReturnType<typeof setTimeout> | null = null;

  private backoff = INITIAL_BACKOFF_MS;

  // Register interest in a set of token ids. Returns an unsubscribe fn.
  subscribe(assetIds: string[], listener: Listener): () => void {
    this.listeners.add(listener);
    for (const id of assetIds) {
      this.refs.set(id, (this.refs.get(id) ?? 0) + 1);
    }
    this.scheduleResubscribe();

    return () => {
      this.listeners.delete(listener);
      for (const id of assetIds) {
        const n = (this.refs.get(id) ?? 0) - 1;
        if (n <= 0) this.refs.delete(id);
        else this.refs.set(id, n);
      }
      this.scheduleResubscribe();
    };
  }

  // Current midpoint (0..1) for a token, or null if not yet known.
  getPrice(assetId: string): number | null {
    const b = this.best.get(assetId);
    if (!b) return null;
    if (b.bid != null && b.ask != null) return (b.bid + b.ask) / 2;
    if (b.bid != null) return b.bid;
    if (b.ask != null) return b.ask;
    if (b.lastTrade != null) return b.lastTrade;
    return null;
  }

  private scheduleResubscribe(): void {
    if (typeof window === 'undefined') return;
    if (this.resubTimer) clearTimeout(this.resubTimer);
    this.resubTimer = setTimeout(() => {
      this.resubTimer = null;
      if (this.refs.size === 0) {
        this.close();
        return;
      }
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendSubscribe();
      } else {
        this.ensureConnected();
      }
    }, RESUBSCRIBE_DEBOUNCE_MS);
  }

  private ensureConnected(): void {
    if (typeof window === 'undefined') return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    this.connect();
  }

  private connect(): void {
    if (typeof window === 'undefined') return;
    let ws: WebSocket;
    try {
      ws = new WebSocket(CLOB_WS_URL);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.backoff = INITIAL_BACKOFF_MS;
      this.sendSubscribe();
      this.startPing();
    };
    ws.onmessage = (ev) => this.handleMessage(ev.data);
    ws.onclose = () => {
      this.stopPing();
      if (this.ws === ws) this.ws = null;
      if (this.refs.size > 0) this.scheduleReconnect();
    };
    ws.onerror = () => {
      // onclose fires next and owns the reconnect.
      try {
        ws.close();
      } catch {
        // already closed
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = this.backoff;
    this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.refs.size > 0) this.connect();
    }, delay);
  }

  private sendSubscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const assets = Array.from(this.refs.keys());
    if (assets.length === 0) return;
    this.ws.send(
      JSON.stringify({
        assets_ids: assets,
        type: 'market',
        // Opts into best_bid_ask / new_market / market_resolved events.
        custom_feature_enabled: true,
      }),
    );
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send('PING');
        } catch {
          // socket dropped mid-send; onclose handles it
        }
      }
    }, PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private close(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // already closed
      }
      this.ws = null;
    }
    this.backoff = INITIAL_BACKOFF_MS;
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== 'string') return;
    if (raw === 'PONG' || raw === 'PING') return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    const events = Array.isArray(parsed) ? parsed : [parsed];
    let changed = false;
    for (const ev of events) {
      if (this.applyEvent(ev)) changed = true;
    }
    if (changed) this.scheduleNotify();
  }

  private applyEvent(ev: unknown): boolean {
    if (!ev || typeof ev !== 'object') return false;
    const e = ev as Record<string, unknown>;
    switch (e.event_type) {
      case 'book':
        return this.setBest(
          e.asset_id,
          topOfBook(e.bids, 'bid'),
          topOfBook(e.asks, 'ask'),
        );
      case 'best_bid_ask':
        return this.setBest(e.asset_id, num(e.best_bid), num(e.best_ask));
      case 'price_change':
        return this.applyPriceChange(e);
      case 'last_trade_price':
        return this.setLastTrade(e.asset_id, num(e.price));
      default:
        return false;
    }
  }

  private applyPriceChange(e: Record<string, unknown>): boolean {
    const changes = Array.isArray(e.price_changes) ? e.price_changes : [];
    let changed = false;
    for (const c of changes) {
      const change = c as Record<string, unknown>;
      if (
        this.setBest(
          change.asset_id,
          num(change.best_bid),
          num(change.best_ask),
        )
      ) {
        changed = true;
      }
    }
    return changed;
  }

  private setBest(assetId: unknown, bid?: number, ask?: number): boolean {
    if (typeof assetId !== 'string') return false;
    if (bid == null && ask == null) return false;
    const prev = this.best.get(assetId) ?? {};
    const next: Best = { ...prev };
    if (bid != null) next.bid = bid;
    if (ask != null) next.ask = ask;
    if (next.bid === prev.bid && next.ask === prev.ask) return false;
    this.best.set(assetId, next);
    return true;
  }

  private setLastTrade(assetId: unknown, price?: number): boolean {
    if (typeof assetId !== 'string' || price == null) return false;
    const prev = this.best.get(assetId) ?? {};
    if (prev.lastTrade === price) return false;
    this.best.set(assetId, { ...prev, lastTrade: price });
    return true;
  }

  // Coalesce a burst of WS messages into one listener flush so a busy
  // market doesn't trigger a render per message.
  private scheduleNotify(): void {
    if (this.notifyTimer) return;
    this.notifyTimer = setTimeout(() => {
      this.notifyTimer = null;
      for (const l of this.listeners) {
        try {
          l();
        } catch {
          // a broken listener must not break the others
        }
      }
    }, NOTIFY_THROTTLE_MS);
  }
}

// One shared instance for the whole app.
export const priceSocket = new PriceSocket();
