// Public catalog paging tests. Gate is mocked through globalThis.fetch.

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { GateCatalogAdapter } from '../src/adapters/gate';

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

// Rows whose displayed question comes only from the event title: either a
// localized `event_title` on the row, or a title fetched from `/events`.
const EVENT_ROWS = Array.from({ length: 30 }, (_, i) => {
  const base = {
    market_id: `e${i + 1}`,
    end_date: FUTURE,
    outcomes: [{ outcome: 'Yes', token_id: `ey${i + 1}` }, { outcome: 'No', token_id: `en${i + 1}` }],
  };
  if (i % 3 === 0) return { ...base, question: `Alpha question ${i + 1}` };
  if (i % 3 === 1) {
    return i % 2 === 0
      ? { ...base, event_id: 'ev-alpha' } // title only via /events
      : { ...base, event_title: { en: 'Alpha localized event' } }; // localized only
  }
  return { ...base, question: `Beta question ${i + 1}`, event_title: 'Beta event' };
});

function mockEventGate() {
  const calls: string[] = [];
  globalThis.fetch = (async (input: string) => {
    const url = new URL(input);
    calls.push(url.pathname);
    if (url.pathname.endsWith('/tokens/prices')) return new Response(JSON.stringify({ items: [] }));
    if (url.pathname.endsWith('/events')) {
      return new Response(JSON.stringify({
        items: [{ event_id: 'ev-other', title: 'Other' }, { event_id: 'ev-alpha', title: { en: 'Alpha fetched event' } }],
        next_cursor: null,
      }));
    }
    const limit = Number(url.searchParams.get('limit'));
    const offset = Number(url.searchParams.get('cursor') || '0');
    const items = EVENT_ROWS.slice(offset, offset + limit);
    const next = offset + items.length < EVENT_ROWS.length ? String(offset + items.length) : null;
    return new Response(JSON.stringify({ items, next_cursor: next }));
  }) as typeof fetch;
  return calls;
}

test('search matches markets whose question comes only from event_title, without skipping', async () => {
  const calls = mockEventGate();
  const adapter = new GateCatalogAdapter({ apiUrl: 'https://gate.test' });
  const seen: { externalId: string; question: string }[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 20; i += 1) {
    const page = await adapter.listMarkets({ limit: 4, search: 'alpha', cursor });
    assert.ok(page.markets.length <= 4 || page.cursor === null);
    seen.push(...page.markets);
    if (!page.cursor) break;
    cursor = page.cursor;
  }
  const expected = EVENT_ROWS.filter((_, i) => i % 3 !== 2).map((row) => row.market_id);
  assert.deepEqual(ids(seen), expected);
  // The event-title-only rows really were matched via the event title.
  const byId = new Map(seen.map((m) => [m.externalId, m.question]));
  assert.equal(byId.get('e2'), 'Alpha localized event');
  assert.equal(byId.get('e5'), 'Alpha fetched event');
  assert.ok(calls.some((path) => path.endsWith('/events')));
});

/** Catalog + detail stub for one product prefix; the detail omits question/title/event_title. */
function mockProductGate(prefix: string) {
  const calls: string[] = [];
  globalThis.fetch = (async (input: string) => {
    const url = new URL(input);
    calls.push(url.pathname);
    assert.ok(url.pathname.startsWith(`${prefix}/`), `unexpected product path ${url.pathname}`);
    const path = url.pathname.slice(prefix.length);
    if (path === '/tokens/prices') return new Response(JSON.stringify({ items: [] }));
    if (path === '/events') {
      return new Response(JSON.stringify({
        items: [{ event_id: 'ev-alpha', title: { en: 'Alpha fetched event' } }],
        next_cursor: null,
      }));
    }
    const detail = /^\/markets\/([^/]+)$/.exec(path);
    if (detail) {
      const row = EVENT_ROWS.find((r) => r.market_id === decodeURIComponent(detail[1] || ''));
      return row ? new Response(JSON.stringify(row)) : new Response('{}', { status: 404 });
    }
    return new Response(JSON.stringify({ items: EVENT_ROWS, next_cursor: null }));
  }) as typeof fetch;
  return calls;
}

for (const [product, prefix] of [
  ['prediction', '/api/v4/prediction'],
  ['event_contracts', '/api/v4/event_contracts'],
] as const) {
  test(`${product}: a market visible only via event-title enrichment also opens via getMarket`, async () => {
    const calls = mockProductGate(prefix);
    const adapter = new GateCatalogAdapter({ apiUrl: 'https://gate.test', product });
    const listed = await adapter.listMarkets({ limit: 100, search: 'alpha fetched' });
    assert.deepEqual(ids(listed.markets), ['e5', 'e11', 'e17', 'e23', 'e29']);

    for (const market of listed.markets) {
      calls.length = 0;
      const opened = await adapter.getMarket({ venue: 'GATE', externalId: market.externalId });
      assert.ok(opened, `${market.externalId} should open`);
      assert.equal(opened.question, 'Alpha fetched event');
      assert.equal(opened.question, market.question);
      assert.ok(calls.some((path) => path.endsWith('/events')));
    }
  });
}
