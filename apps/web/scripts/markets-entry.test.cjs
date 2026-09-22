const assert = require('node:assert/strict');
const { test } = require('node:test');
const { afterSignIn, isMarketsEntry, isPublicMarketRoute, marketsOnboarding, MARKETS_LOGIN } = require('../src/lib/markets/entry.ts');

test('Markets entry is public without making adjacent routes public', () => {
  assert.equal(isMarketsEntry('/markets'), true);
  for (const path of ['/markets/private', '/portfolio', '/m/123', '/', '/api/markets']) {
    assert.equal(isMarketsEntry(path), false);
  }
});

test('Market catalog and detail pages are public', () => {
  assert.equal(isPublicMarketRoute('/markets'), true);
  assert.equal(isPublicMarketRoute('/m/[id]'), true);
  for (const path of ['/portfolio', '/m', '/m/private/settings', '/', '/api/markets']) {
    assert.equal(isPublicMarketRoute(path), false);
  }
});

test('Markets intent survives sign-in and account setup', () => {
  const next = new URL(MARKETS_LOGIN, 'https://backspace.example').searchParams.get('next');
  assert.equal(afterSignIn(next), '/markets');
  assert.equal(marketsOnboarding('/auth/login', next), '/auth/onboarding?next=%2Fmarkets');
  assert.equal(marketsOnboarding('/markets', undefined), '/auth/onboarding?next=%2Fmarkets');
});

test('Unrecognized return destinations cannot become open redirects', () => {
  for (const next of [undefined, null, '', '/', 'https://example.com', '//example.com', '/markets/evil', ['/markets'], '%2Fmarkets']) {
    assert.equal(afterSignIn(next), '/');
    assert.equal(marketsOnboarding('/auth/login', next), '/auth/onboarding');
  }
});

