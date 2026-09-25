import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from 'react-query';

import axios from '@src/lib/axios';
import { useLiveOrderBook } from '@src/hooks/useLiveOrderBook';
import { useLivePrices } from '@src/hooks/useLivePrices';
import { useMarket } from '@src/hooks/useMarket';
import type { MarketCardData } from '@src/components/Market/MarketCard';

type DetailMarket = MarketCardData & {
  description?: string;
  status?: 'ACTIVE' | 'FROZEN' | 'RESOLVED' | 'INVALIDATED';
  resolutionSource?: string | null;
  winningOutcome?: string | null;
  acceptingOrders?: boolean;
  volumeUsd?: string | null;
  volume24hUsd?: string | null;
  liquidityUsd?: string | null;
};
type Level = { price?: string; size?: string } | [string, string];
type Book = { bids?: Level[]; asks?: Level[] };
type Trade = { id?: string; trade_id?: string; token_id?: string; outcome?: string; side?: string; price?: string; size?: string; created_at?: number };
type HistoryPoint = { p?: string; t?: number };
type MarketData = {
  trades: Trade[];
  books: Array<{ tokenId: string; book: Book }>;
  histories: Array<{ tokenId: string; history: { history?: HistoryPoint[] } | HistoryPoint[] }>;
  fetchedAt: number;
};

async function fetchMarketData(id: string): Promise<MarketData> {
  const { data } = await axios().get<MarketData>(`/markets/${encodeURIComponent(id)}/data`);
  return data;
}

function number(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function money(value?: string | null) {
  const amount = number(value);
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', notation: amount >= 10000 ? 'compact' : 'standard', maximumFractionDigits: amount >= 100 ? 0 : 2 }).format(amount);
}
function quantity(value?: string | null) {
  const amount = number(value);
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, {
    notation: Math.abs(amount) >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(amount) < 10 ? 2 : 0,
  }).format(amount);
}
function date(value: Date | string) {
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function MarketDetail() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const marketQuery = useMarket(id || null);
  const market = marketQuery.data as DetailMarket | undefined;
  const dataQuery = useQuery(['gate-market-data', id], () => fetchMarketData(id), {
    enabled: Boolean(id), refetchInterval: 10_000, staleTime: 5_000,
  });
  const live = useLivePrices(market?.outcomes.map((outcome) => outcome.externalId) || []);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const selectedOutcome = market?.outcomes.find((outcome) => outcome.externalId === selectedToken)
    || market?.outcomes[0];
  const liveDepth = useLiveOrderBook(selectedOutcome?.externalId);
  const restBook = dataQuery.data?.books.find((item) => item.tokenId === selectedOutcome?.externalId)?.book;
  const book = liveDepth.book || restBook;
  const rawHistory = dataQuery.data?.histories.find((item) => item.tokenId === selectedOutcome?.externalId)?.history;
  const history = Array.isArray(rawHistory) ? rawHistory : rawHistory?.history || [];

  if (marketQuery.isLoading) return <MarketSkeleton />;
  if (marketQuery.isError || !market) return <ErrorState retry={() => marketQuery.refetch()} />;

  const status = market.status || (new Date(market.closesAt) <= new Date() ? 'FROZEN' : 'ACTIVE');
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5 text-ink sm:px-6">
      <Head><title>{market.question} · Backspace Markets</title></Head>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/markets"><a className="text-sm text-brand-2">← Markets</a></Link>
        <StatusBadge status={status} accepting={market.acceptingOrders} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="flex gap-4">
            {market.imageUrl && <img src={market.imageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />}
            <div>
              {market.category && <div className="text-xs font-mono uppercase tracking-wider text-ink-3">{market.category}</div>}
              <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{market.question}</h1>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="24h volume" value={money(market.volume24hUsd)} />
            <Metric label="Total volume" value={money(market.volumeUsd)} />
            <Metric label="Liquidity" value={money(market.liquidityUsd)} />
            <Metric label="Closes" value={date(market.closesAt)} small />
          </div>

          <OutcomeSelector market={market} live={live} selected={selectedOutcome?.externalId} onSelect={setSelectedToken} />
          <ProbabilityChart
            key={selectedOutcome?.externalId || 'outcome'}
            points={history}
            outcome={selectedOutcome?.label || 'Outcome'}
            livePrice={selectedOutcome ? live[selectedOutcome.externalId] : null}
            loading={dataQuery.isLoading}
          />
          <MarketRules market={market} />
          <RecentTrades trades={dataQuery.data?.trades || []} loading={dataQuery.isLoading} />
        </div>

        <aside className="min-w-0">
          <div className="sticky top-20 space-y-4">
            <OrderBook
              book={book}
              outcome={selectedOutcome?.label || 'Outcome'}
              loading={dataQuery.isLoading && !liveDepth.book}
              live={liveDepth.connected && Boolean(liveDepth.book)}
            />
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-lg font-semibold">Trading through Gate</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                Live prices and liquidity are connected. Order entry will unlock when Gate activates Backspace Builder user accounts and sandbox credentials.
              </p>
              <button type="button" disabled className="mt-4 w-full rounded-full bg-brand px-4 py-3 font-semibold text-white opacity-60">
                Trading coming soon
              </button>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}

function OutcomeSelector({ market, live, selected, onSelect }: { market: DetailMarket; live: Record<string, number | null>; selected?: string; onSelect: (id: string) => void }) {
  const outcomes = [...market.outcomes].sort((a, b) => (live[b.externalId] ?? number(b.lastPrice) ?? -1) - (live[a.externalId] ?? number(a.lastPrice) ?? -1));
  return (
    <section className="mt-6 rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold">Outcomes</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {outcomes.map((outcome) => {
          const price = live[outcome.externalId] ?? number(outcome.lastPrice);
          const active = selected === outcome.externalId;
          return <button key={outcome.externalId} type="button" onClick={() => onSelect(outcome.externalId)} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left ${active ? 'border-brand-2 bg-brand-soft' : 'border-line bg-canvas hover:border-line-2'}`}>
            <span className="font-medium">{outcome.label}</span>
            <span className="font-mono text-lg font-semibold">{price == null ? '—' : `${Math.round(price * 100)}¢`}</span>
          </button>;
        })}
      </div>
    </section>
  );
}

function ProbabilityChart({ points, outcome, livePrice, loading }: { points: HistoryPoint[]; outcome: string; livePrice?: number | null; loading: boolean }) {
  const historical = useMemo(() => points.map((point) => {
    const timestamp = number(point.t);
    return { x: timestamp != null && timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp, y: number(point.p) };
  }).filter((point): point is { x: number; y: number } => point.x != null && point.y != null)
    .sort((a, b) => a.x - b.x), [points]);
  const [livePoints, setLivePoints] = useState<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    if (livePrice == null || !Number.isFinite(livePrice)) return;
    const next = { x: Date.now(), y: Math.max(0, Math.min(1, livePrice)) };
    setLivePoints((current) => {
      const previous = current[current.length - 1];
      if (previous?.y === next.y) return current;
      return [...current, next].slice(-240);
    });
  }, [livePrice]);

  const clean = useMemo(() => [...historical, ...livePoints]
    .sort((a, b) => a.x - b.x), [historical, livePoints]);
  const path = useMemo(() => {
    if (clean.length < 2) return '';
    const min = clean[0].x; const max = clean[clean.length - 1].x || min + 1;
    return clean.map((point, index) => `${index ? 'L' : 'M'} ${((point.x - min) / (max - min)) * 1000} ${240 - point.y * 240}`).join(' ');
  }, [clean]);
  const latest = clean.length ? clean[clean.length - 1].y : null;
  const firstDate = clean.length ? new Date(clean[0].x).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  const lastDate = clean.length ? new Date(clean[clean.length - 1].x).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  return <section className="mt-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
    <div className="mb-4 flex items-start justify-between gap-4"><div><div className="text-xs font-mono uppercase tracking-wider text-ink-3">Probability</div><h2 className="mt-1 text-lg font-semibold">{outcome}</h2></div><div className="text-right"><div className="text-3xl font-bold tracking-tight text-brand-2">{latest == null ? '—' : `${Math.round(latest * 100)}%`}</div><span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-3"><span className={`h-1.5 w-1.5 rounded-full ${livePrice == null ? 'bg-ink-3' : 'animate-pulse bg-green-2'}`} />{livePrice == null ? 'Connecting to Gate' : 'Live via Gate'}</span></div></div>
    <div className="relative h-56 overflow-hidden rounded-xl border border-line bg-canvas p-3">
      <div className="pointer-events-none absolute inset-x-3 top-1/4 border-t border-line/70"/><div className="pointer-events-none absolute inset-x-3 top-1/2 border-t border-line/70"/><div className="pointer-events-none absolute inset-x-3 top-3/4 border-t border-line/70"/>
      {loading ? <div className="h-full animate-pulse rounded-lg bg-white/[0.03]" /> : path ? <svg viewBox="0 0 1000 240" preserveAspectRatio="none" className="relative h-full w-full"><defs><linearGradient id="gateArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7B4CFF" stopOpacity=".42"/><stop offset="1" stopColor="#7B4CFF" stopOpacity="0"/></linearGradient></defs><path d={`${path} L 1000 240 L 0 240 Z`} fill="url(#gateArea)"/><path d={path} fill="none" stroke="#7B4CFF" strokeWidth="4" vectorEffect="non-scaling-stroke"/></svg> : <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-3">Gate has not published enough price history to draw this chart yet.</div>}
    </div>
    {clean.length > 1 && <div className="mt-2 flex justify-between text-[11px] font-mono text-ink-3"><span>{firstDate}</span><span>{lastDate}</span></div>}
  </section>;
}

function OrderBook({ book, outcome, loading, live }: { book?: Book; outcome: string; loading: boolean; live: boolean }) {
  const rows = (levels?: Level[]) => (levels || []).slice(0, 8).map((level) => Array.isArray(level) ? level : [level.price || '0', level.size || '0']);
  const asks = rows(book?.asks).reverse(); const bids = rows(book?.bids);
  return <section className="rounded-2xl border border-line bg-surface p-4">
    <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="font-semibold">Order book</h2><span className="text-xs text-ink-3">{outcome}</span></div><span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-3"><span className={`h-1.5 w-1.5 rounded-full ${live ? 'animate-pulse bg-green-2' : 'bg-ink-3'}`} />{live ? 'Live' : 'Syncing'}</span></div>
    <div className="grid grid-cols-2 pb-2 text-[10px] font-mono uppercase text-ink-3"><span>Price</span><span className="text-right">Shares</span></div>
    {loading && !book ? <div className="h-48 animate-pulse rounded-lg bg-canvas" /> : <>{asks.map(([price, size], index) => <BookRow key={`a-${index}`} price={price} size={size} ask />)}{asks.length > 0 && bids.length > 0 && <div className="my-2 border-t border-line" />}{bids.map(([price, size], index) => <BookRow key={`b-${index}`} price={price} size={size} />)}{asks.length + bids.length === 0 && <p className="py-8 text-center text-sm text-ink-3">No resting orders.</p>}</>}
  </section>;
}
function BookRow({ price, size, ask }: { price: string; size: string; ask?: boolean }) { return <div className="grid grid-cols-2 py-1 text-sm font-mono"><span className={ask ? 'text-pink-2' : 'text-green-2'}>{Math.round(Number(price) * 100)}¢</span><span className="text-right">{Number(size).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>; }

function RecentTrades({ trades, loading }: { trades: Trade[]; loading: boolean }) {
  return <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface"><div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 className="font-semibold">Recent trades</h2><span className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Live</span></div>{loading && trades.length === 0 ? <div className="h-36 animate-pulse bg-canvas" /> : trades.length ? <div className="divide-y divide-line">{trades.slice(0, 12).map((trade, index) => { const side = (trade.side || 'trade').toUpperCase(); return <div key={trade.id || trade.trade_id || index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_44px] items-center gap-2 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_110px_64px]"><span className="truncate font-medium">{trade.outcome || 'Outcome'}</span><span className={`truncate text-right font-mono text-xs sm:text-sm ${side === 'SELL' ? 'text-pink-2' : 'text-green-2'}`}>{side} <span className="text-ink-2">{quantity(trade.size)}</span></span><span className="text-right font-mono text-xs sm:text-sm">{number(trade.price) == null ? '—' : `${Math.round(Number(trade.price) * 100)}¢`}</span></div>; })}</div> : <p className="px-4 py-8 text-center text-sm text-ink-3">No recent trades reported.</p>}</section>;
}

function MarketRules({ market }: { market: DetailMarket }) { return <section className="mt-4 rounded-2xl border border-line bg-surface p-5"><h2 className="text-lg font-semibold">Rules and resolution</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{market.description || 'Gate has not published additional market rules for this market.'}</p><div className="mt-4 border-t border-line pt-4 text-sm"><span className="text-ink-3">Resolution source: </span>{market.resolutionSource ? <a href={market.resolutionSource} target="_blank" rel="noreferrer" className="break-all text-brand-2">{market.resolutionSource}</a> : <span>Provided in Gate market metadata</span>}</div>{market.winningOutcome && <div className="mt-2 text-sm"><span className="text-ink-3">Winning outcome: </span><strong>{market.winningOutcome}</strong></div>}</section>; }
function Metric({ label, value, small }: { label: string; value: string; small?: boolean }) { return <div className="rounded-xl border border-line bg-surface p-3"><div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">{label}</div><div className={`mt-1 font-semibold ${small ? 'text-sm' : 'text-lg'}`}>{value}</div></div>; }
function StatusBadge({ status, accepting }: { status: string; accepting?: boolean }) { const label = status === 'ACTIVE' && accepting !== false ? 'Live' : status === 'RESOLVED' ? 'Resolved' : status === 'INVALIDATED' ? 'Invalidated' : 'Trading closed'; return <span className={`rounded-full px-3 py-1 text-xs font-mono uppercase ${label === 'Live' ? 'bg-green-vivid/15 text-green-2' : 'bg-white/[0.06] text-ink-3'}`}>{label}</span>; }
function MarketSkeleton() { return <div className="mx-auto max-w-6xl px-4 py-8"><div className="h-8 w-3/4 animate-pulse rounded bg-white/[0.05]"/><div className="mt-6 h-80 animate-pulse rounded-2xl bg-white/[0.04]"/></div>; }
function ErrorState({ retry }: { retry: () => void }) { return <div className="mx-auto max-w-lg px-6 py-20 text-center text-ink"><h1 className="text-2xl font-bold">Market unavailable</h1><p className="mt-2 text-ink-3">Gate market data could not be loaded.</p><button type="button" onClick={retry} className="mt-5 rounded-full bg-brand px-5 py-2.5 font-semibold text-white">Try again</button></div>; }
