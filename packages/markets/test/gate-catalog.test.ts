// Public catalog paging tests. Gate is mocked through globalThis.fetch.

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { GateCatalogAdapter } from '../src/adapters/gate.ts';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const FUTURE = Math.floor(Date.now() / 1000) + 86400;
const UPSTREAM = Array.from({ length: 250 }, (_, i) => ({
  market_id: `m${i + 1}`,
  question: i % 2 === 0 ? `Even question ${i + 1}` : `Odd question ${i + 1}`,
  event_title: 'Event',
  end_date: FUTURE,
  outcomes: [{ outcome: 'Yes', token_id: `y${i + 1}` }, { outcome: 'No', token_id: `n${i + 1}` }],
}));

/** Offset-cursor Gate stub. `ignoreLimit` mimics an upstream that always returns 100. */
function mockGate(opts: { ignoreLimit?: boolean } = {}) {
  const limits: number[] = [];
  globalThis.fetch = (async (input: string) => {
    const url = new URL(input);
    if (url.pathname.endsWith('/tokens/prices')) return new Response(JSON.stringify({ items: [] }));
    const requested = Number(url.searchParams.get('limit'));
    limits.push(requested);
    const limit = opts.ignoreLimit ? 100 : requested;
    const offset = Number(url.searchParams.get('cursor') || '0');
    const items = UPSTREAM.slice(offset, offset + limit);
    const next = offset + items.length < UPSTREAM.length ? String(offset + items.length) : null;
    return new Response(JSON.stringify({ items, next_cursor: next }));
  }) as typeof fetch;
  return limits;
}

const ids = (markets: { externalId: string }[]) => markets.map((m) => m.externalId);
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `m${from + i}`);

test('limit:50 requests only 50 rows and the cursor resumes at row 51', async () => {
  const limits = mockGate();
  const adapter = new GateCatalogAdapter({ apiUrl: 'https://gate.test' });
  const first = await adapter.listMarkets({ limit: 50 });
  assert.deepEqual(ids(first.markets), range(1, 50));
  assert.equal(first.cursor, '50');
  const second = await adapter.listMarkets({ limit: 50, cursor: first.cursor || undefined });
  assert.deepEqual(ids(second.markets), range(51, 100));
  assert.deepEqual(limits, [50, 50]);
});

test('a 100-row upstream page for a limit:50 call does not skip rows 51–100', async () => {
  mockGate({ ignoreLimit: true });
  const adapter = new GateCatalogAdapter({ apiUrl: 'https://gate.test' });
  const first = await adapter.listMarkets({ limit: 50 });
  const second = await adapter.listMarkets({ limit: 50, cursor: first.cursor || undefined });
  const seen = [...ids(first.markets), ...ids(second.markets)];
  // Every upstream row up to the second cursor was returned exactly once.
  assert.deepEqual(seen, range(1, Number(second.cursor)));
  assert.ok(seen.includes('m51') && seen.includes('m100'));
});

test('filtered pages keep paging and never skip matching rows', async () => {
  const limits = mockGate();
  const adapter = new GateCatalogAdapter({ apiUrl: 'https://gate.test' });
  const first = await adapter.listMarkets({ limit: 60, search: 'even' });
  assert.equal(first.markets.length, 60);
  assert.ok(limits[0] === 60 && limits.length > 1 && limits.every((l) => l <= 100));
  const second = await adapter.listMarkets({ limit: 60, search: 'even', cursor: first.cursor || undefined });
  const all = [...ids(first.markets), ...ids(second.markets)];
  const expected = UPSTREAM.filter((_, i) => i % 2 === 0).slice(0, all.length).map((m) => m.market_id);
  assert.deepEqual(all, expected);
});
