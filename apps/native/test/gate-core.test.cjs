// Native Gate client tests. Runs against the CommonJS build of
// src/lib/gate-core.ts (see tsconfig.test.json) with a mocked fetch.
'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { createGateClient } = require('../dist/test-build/lib/gate-core.js');

const BASES = {
  prediction: 'https://gate.test/api/v4/prediction',
  event_contracts: 'https://gate.test/api/v4/event_contracts',
};

// A market whose only displayable question is the title on its /events record.
const TITLELESS = {
  market_id: 'm1',
  event_id: 'e1',
  outcomes: [{ outcome: 'Yes', token_id: 'y1' }, { outcome: 'No', token_id: 'n1' }],
};

function mockGate(product) {
  const calls = [];
  const json = (body) => ({ ok: true, status: 200, json: async () => body });
  const fetchImpl = async (input) => {
    const url = new URL(input);
    calls.push(url.pathname);
    assert.ok(input.startsWith(BASES[product]), `request went to ${product} base: ${input}`);
    const path = url.pathname.slice(new URL(BASES[product]).pathname.length);
    if (path === '/markets') return json({ items: [TITLELESS], next_cursor: null });
    if (path === '/markets/m1') return json(TITLELESS);
    if (path === '/events') return json({ items: [{ event_id: 'other', title: 'Other' }, { event_id: 'e1', title: { en: 'Event-only title' } }], next_cursor: null });
    if (path === '/tokens/prices') return json({ items: [{ token_id: 'y1', price: '0.4' }] });
    return { ok: false, status: 404, json: async () => ({}) };
  };
  return { client: createGateClient(fetchImpl, BASES), calls };
}

for (const product of ['prediction', 'event_contracts']) {
  test(`${product}: list keeps a market titled only by its event`, async () => {
    const { client, calls } = mockGate(product);
    const markets = await client.listMarkets(10, product);
    assert.equal(markets.length, 1);
    assert.equal(markets[0].question, 'Event-only title');
    assert.equal(markets[0].eventTitle, 'Event-only title');
    assert.equal(markets[0].product, product);
    assert.deepEqual(markets[0].outcomes.map((o) => o.price), [0.4, 0.6]);
    assert.ok(calls.some((path) => path.endsWith('/events')));
  });

  test(`${product}: detail opens a market titled only by its event`, async () => {
    const { client } = mockGate(product);
    const market = await client.getMarket('m1', product);
    assert.equal(market.id, 'm1');
    assert.equal(market.question, 'Event-only title');
    assert.equal(market.eventTitle, 'Event-only title');
    assert.equal(market.product, product);
  });
}

test('question order: question, then title, then event title', async () => {
  const core = require('../dist/test-build/lib/gate-core.js');
  const titles = new Map([['e1', 'Fetched']]);
  const base = { market_id: 'm', event_id: 'e1', outcomes: [{ outcome: 'Yes', token_id: 'y' }] };
  assert.equal(core.normalizeMarket({ ...base, question: 'Q', title: 'T', event_title: 'E' }, titles, new Map(), 'prediction').question, 'Q');
  assert.equal(core.normalizeMarket({ ...base, title: 'T', event_title: 'E' }, titles, new Map(), 'prediction').question, 'T');
  assert.equal(core.normalizeMarket({ ...base, event_title: 'E' }, titles, new Map(), 'prediction').question, 'E');
  assert.equal(core.normalizeMarket(base, titles, new Map(), 'prediction').question, 'Fetched');
  assert.equal(core.normalizeMarket(base, new Map(), new Map(), 'prediction'), null);
});

test('a failed /events lookup does not drop titled markets', async () => {
  const fetchImpl = async (input) => {
    const path = new URL(input).pathname;
    if (path.endsWith('/events')) return { ok: false, status: 500, json: async () => ({}) };
    if (path.endsWith('/markets/m2')) return { ok: true, status: 200, json: async () => ({ ...TITLELESS, market_id: 'm2', question: 'Own question' }) };
    return { ok: true, status: 200, json: async () => ({ items: [] }) };
  };
  const market = await createGateClient(fetchImpl, BASES).getMarket('m2', 'prediction');
  assert.equal(market.question, 'Own question');
  assert.equal(market.eventTitle, null);
});
