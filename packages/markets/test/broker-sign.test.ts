// Broker signing tests. Run with `pnpm --filter @backspace/markets test`
// (compiled to CommonJS by tsconfig.test.json, then run with node:test; Node >= 18).
//
// Uses ONLY the dummy secret "test-broker-secret". Expected SIGN values are
// fixtures computed from the documented algorithm; do not regenerate them
// from this implementation.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BrokerNotConfiguredError,
  DEFAULT_DEXBUILDER_API_URL,
  GateBrokerClient,
  GateBrokerError,
  KNOWN_GATE_LABELS,
  brokerOrigin,
  buildSignatureString,
  canonicalBrokerPath,
  isBrokerConfigured,
  readBrokerConfig,
  sha512Hex,
  signBrokerRequest,
  signingQueryString,
} from '../src/server/broker';

const SECRET = 'test-broker-secret';
const TS = '1700000000';
const EMPTY_SHA512 = 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e';

const FIXTURE_A = '727560a9c641b303dd7556be01f92908bf3721bf39327ad21daa3ce2395f2f6c20754c441dace19a8547be39f8a118232b51f8d1b31d5d6f35003769381f0ea4';
const FIXTURE_B = '4454ef3bfbcc65a06d10ccffcbfb4ea407d35cf7df08a8bcecb3ceeaf2e39ae14f01ffcaedd8f9aba96a3915d3438cd40eaaf75e9492dcba77fd580a3abe64d8';
const FIXTURE_C = 'b9501b61003b9bc170e331d6cd1fb0b52f1333daa9b71a790f3564d5be8a4e0d9859c71138a36f8b1798491b05a2f0986b9ce1b0a7074ec471c13cc36552611f';

const ORDER_BODY = '{"token_id":"ge_yes","side":"BUY"}';

test('empty body hashes the empty string', () => {
  assert.equal(sha512Hex(''), EMPTY_SHA512);
});

test('signature string is five lines joined by \\n', () => {
  const s = buildSignatureString({
    method: 'get', path: '/api/v4/dexbuilder/user/info', queryString: '', body: '', timestamp: TS,
  });
  assert.equal(s, ['GET', '/api/v4/dexbuilder/user/info', '', EMPTY_SHA512, TS].join('\n'));
});

test('a) GET /api/v4/dexbuilder/user/info, no query, empty body', () => {
  const sign = signBrokerRequest(SECRET, {
    method: 'GET', path: '/api/v4/dexbuilder/user/info', queryString: '', body: '', timestamp: TS,
  });
  assert.equal(sign, FIXTURE_A);
});

test('b) GET /api/v4/prediction/markets?limit=20&active=true', () => {
  const sign = signBrokerRequest(SECRET, {
    method: 'GET', path: '/api/v4/prediction/markets', queryString: 'limit=20&active=true', body: '', timestamp: TS,
  });
  assert.equal(sign, FIXTURE_B);
  assert.equal(signingQueryString([['limit', 20], ['active', true]]), 'limit=20&active=true');
});

test('c) POST /api/v4/broker/prediction/orders with exact body bytes', () => {
  const sign = signBrokerRequest(SECRET, {
    method: 'POST', path: '/api/v4/broker/prediction/orders', queryString: '', body: ORDER_BODY, timestamp: TS,
  });
  assert.equal(sign, FIXTURE_C);
});

test('d) pretty-printed or reordered JSON changes SIGN', () => {
  const base = { method: 'POST', path: '/api/v4/broker/prediction/orders', queryString: '', timestamp: TS };
  const pretty = signBrokerRequest(SECRET, { ...base, body: JSON.stringify({ token_id: 'ge_yes', side: 'BUY' }, null, 2) });
  const reordered = signBrokerRequest(SECRET, { ...base, body: '{"side":"BUY","token_id":"ge_yes"}' });
  assert.notEqual(pretty, FIXTURE_C);
  assert.notEqual(reordered, FIXTURE_C);
  assert.notEqual(pretty, reordered);
});

function client() {
  return new GateBrokerClient({
    config: { apiKey: 'test-broker-key', apiSecret: SECRET, baseUrl: 'https://example.invalid' },
    now: () => Number(TS),
  });
}

test('X-User-Wallet-Address is sent as a header but not signed', () => {
  const c = client();
  const withWallet = c.prepare('/api/v4/dexbuilder/user/info', { walletAddress: '0x000000000000000000000000000000000000dEaD' });
  const without = c.prepare('/api/v4/dexbuilder/user/info');
  assert.equal(withWallet.headers.SIGN, without.headers.SIGN);
  assert.equal(withWallet.headers.SIGN, FIXTURE_A);
  assert.equal(withWallet.headers['X-User-Wallet-Address'], '0x000000000000000000000000000000000000dEaD');
  assert.equal(without.headers['X-User-Wallet-Address'], undefined);
  assert.equal(withWallet.headers.Timestamp, TS);
  assert.equal(withWallet.headers.KEY, 'test-broker-key');
  assert.equal(withWallet.headers.Accept, 'application/json');
});

test('client signs the exact body bytes it sends', () => {
  const c = client();
  const prepared = c.prepare('/api/v4/broker/prediction/orders', {
    method: 'POST', body: { token_id: 'ge_yes', side: 'BUY' },
  });
  assert.equal(prepared.body, ORDER_BODY);
  assert.equal(prepared.headers.SIGN, FIXTURE_C);
  assert.equal(prepared.headers['Content-Type'], 'application/json');
});

test('client signs unencoded query in send order and sends it encoded', () => {
  const c = client();
  const prepared = c.prepare('/api/v4/prediction/markets', { query: [['limit', 20], ['active', 'true']] });
  assert.equal(prepared.headers.SIGN, FIXTURE_B);
  assert.equal(prepared.url, 'https://example.invalid/api/v4/prediction/markets?limit=20&active=true');
});

test('client corrects clock skew from /prediction/time and keeps seconds', async () => {
  const calls: string[] = [];
  const c = new GateBrokerClient({
    config: { apiKey: 'test-broker-key', apiSecret: SECRET, baseUrl: 'https://example.invalid' },
    now: () => Number(TS) - 30,
    fetch: async (url) => {
      calls.push(url);
      return { ok: true, status: 200, text: async () => JSON.stringify({ server_time: Number(TS) * 1000 }) };
    },
  });
  await c.syncClock();
  assert.equal(c.timestamp(), TS);
  assert.deepEqual(calls, ['https://example.invalid/api/v4/prediction/time']);
});

test('missing credentials raise BrokerNotConfiguredError without values', () => {
  assert.equal(isBrokerConfigured({}), false);
  assert.equal(isBrokerConfigured({ GATE_BROKER_API_KEY: 'k' }), false);
  assert.throws(() => readBrokerConfig({ GATE_BROKER_API_KEY: 'k', GATE_BROKER_API_SECRET: '  ' }), (error: unknown) => {
    assert.ok(error instanceof BrokerNotConfiguredError);
    assert.equal((error as BrokerNotConfiguredError).status, 503);
    assert.ok(!(error as Error).message.includes('GATE_BROKER'));
    return true;
  });
  const config = readBrokerConfig({ GATE_BROKER_API_KEY: 'k', GATE_BROKER_API_SECRET: SECRET });
  assert.equal(config.baseUrl, 'https://api.dexbuilder.com');
});

test('Platform HTTP 200 with non-zero code is an error; code 0 unwraps data', async () => {
  const make = (payload: unknown) => new GateBrokerClient({
    config: { apiKey: 'test-broker-key', apiSecret: SECRET, baseUrl: 'https://example.invalid' },
    fetch: async () => ({ ok: true, status: 200, text: async () => JSON.stringify(payload) }),
  });
  const data = await make({ code: 0, message: 'ok', data: { uid: 1 }, trace_id: 't' }).platform<{ uid: number }>('user/info');
  assert.deepEqual(data, { uid: 1 });
  await assert.rejects(make({ code: 1001, message: 'bad', label: 'INVALID' }).platform('user/info'), GateBrokerError);
});

test('client object does not expose the secret when serialized', () => {
  const c = client();
  assert.ok(!JSON.stringify(c).includes(SECRET));
  assert.ok(!Object.values(c).some((value) => value === SECRET));
});

test('signed fetches never follow redirects', async () => {
  const seen: Array<{ url: string; redirect: string }> = [];
  const c = new GateBrokerClient({
    config: { apiKey: 'test-broker-key', apiSecret: SECRET, baseUrl: 'https://example.invalid' },
    fetch: async (url, init) => {
      seen.push({ url, redirect: init.redirect });
      return { ok: false, status: 302, text: async () => '' };
    },
  });
  await assert.rejects(c.prediction('orders'), (error: unknown) => {
    assert.ok(error instanceof GateBrokerError);
    assert.equal((error as GateBrokerError).status, 502);
    return true;
  });
  assert.deepEqual(seen, [{ url: 'https://example.invalid/api/v4/broker/prediction/orders', redirect: 'error' }]);
});

test('Broker origin must be https, with no loopback exception', () => {
  const env = { GATE_BROKER_API_KEY: 'k', GATE_BROKER_API_SECRET: SECRET };
  assert.equal(readBrokerConfig({ ...env, GATE_DEXBUILDER_API_URL: 'https://api.example.com/' }).baseUrl, 'https://api.example.com');
  for (const plain of ['http://localhost:4010', 'http://127.0.0.1:4010', 'http://[::1]:4010', 'http://localhost']) {
    assert.throws(() => readBrokerConfig({ ...env, GATE_DEXBUILDER_API_URL: plain }), /https/);
    assert.throws(() => brokerOrigin(plain), /https/);
  }
  assert.throws(() => readBrokerConfig({ ...env, GATE_DEXBUILDER_API_URL: 'http://api.example.com' }), /https/);
  assert.throws(() => readBrokerConfig({ ...env, GATE_DEXBUILDER_API_URL: 'https://api.example.com/proxy' }), /bare origin/);
  assert.throws(() => readBrokerConfig({ ...env, GATE_DEXBUILDER_API_URL: 'https://u:p@api.example.com' }), /bare origin/);
  assert.equal(brokerOrigin(DEFAULT_DEXBUILDER_API_URL), 'https://api.dexbuilder.com');
  assert.throws(() => new GateBrokerClient({
    config: { apiKey: 'k', apiSecret: SECRET, baseUrl: 'http://example.invalid' },
  }), /https/);
  assert.throws(() => new GateBrokerClient({
    config: { apiKey: 'k', apiSecret: SECRET, baseUrl: 'http://127.0.0.1:4010' },
    fetch: async () => ({ ok: true, status: 200, text: async () => '{}' }),
  }), /https/);
});

test('non-canonical paths are rejected so SIGN always matches the sent path', async () => {
  const c = client();
  for (const bad of [
    '/api/v4/broker/prediction/../dexbuilder/user/info',
    '/api/v4/broker/prediction/./orders',
    '/api/v4/broker/prediction/orders#frag',
    '/api/v4/broker/prediction/orders?x=1',
    '/api/v4/broker/prediction//orders',
    '/api/v4/broker/prediction/%2e%2e/orders',
    '/api/v4/broker/prediction/or ders',
    '/api/v4/broker/prediction\\orders',
    '/api/v4/broker/prediction/örders',
    'api/v4/broker/prediction/orders',
  ]) {
    assert.throws(() => c.prepare(bad), /canonical/, bad);
  }
  await assert.rejects(c.prediction('../../dexbuilder/user/info'), /canonical/);
  assert.equal(canonicalBrokerPath('/api/v4/broker/prediction/orders/o-1'), '/api/v4/broker/prediction/orders/o-1');
  const prepared = c.prepare('/api/v4/dexbuilder/user/info');
  assert.equal(new URL(prepared.url).pathname, '/api/v4/dexbuilder/user/info');
  assert.equal(prepared.headers.SIGN, FIXTURE_A);
});

test('upstream error text and unknown labels never reach GateBrokerError', async () => {
  const leak = 'KEY=test-broker-key SIGN=deadbeef';
  const make = (status: number, payload: unknown) => new GateBrokerClient({
    config: { apiKey: 'test-broker-key', apiSecret: SECRET, baseUrl: 'https://example.invalid' },
    fetch: async () => ({ ok: status < 400, status, text: async () => JSON.stringify(payload) }),
  });
  await assert.rejects(make(400, { label: leak, message: leak }).prediction('orders'), (error: unknown) => {
    const e = error as GateBrokerError;
    assert.equal(e.label, null);
    assert.equal(e.message, 'Gate rejected the request.');
    assert.ok(!JSON.stringify({ ...e, message: e.message }).includes('SIGN'));
    return true;
  });
  await assert.rejects(make(400, { label: 'balance_not_enough', message: leak }).prediction('orders'), (error: unknown) => {
    const e = error as GateBrokerError;
    assert.equal(e.label, 'BALANCE_NOT_ENOUGH');
    assert.equal(e.message, KNOWN_GATE_LABELS.BALANCE_NOT_ENOUGH);
    return true;
  });
  await assert.rejects(make(200, { code: 7, label: leak, message: leak }).platform('user/info'), (error: unknown) => {
    const e = error as GateBrokerError;
    assert.equal(e.status, 422);
    assert.equal(e.gateCode, 7);
    assert.ok(!e.message.includes('KEY'));
    return true;
  });
});
