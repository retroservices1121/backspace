# Backspace Markets: Gate DexBuilder foundation

Backspace Markets lives inside the existing social product at `/markets`.
Gate DexBuilder is the only market provider and the authority for orders,
positions, balances and fills. Backspace stores none of them.

## Current implementation

- `/markets` is public and displays Gate DexBuilder markets without requiring sign-in.
- `/api/markets` requests the live Gate catalog and does not read or write market rows.
  - Default is Prediction Markets (`/api/v4/prediction`).
  - `?product=event_contracts` returns Event Contracts (`/api/v4/event_contracts`); `?product=all` merges both.
  - Every market has a `product` field (`prediction` or `event_contracts`).
  - Gate list calls use at most `limit=100` and follow `next_cursor`.
- `/api/markets/{market_id}` requests the live Gate market definition (`?product=` optional; without it Prediction is tried first, then Event Contracts).
- `/api/markets/{market_id}/data` returns recent trades (`{ items, next_cursor }` envelope, ms timestamps), order books and 14-day price history.
- Outcome ids come from `outcomes[].token_id`. Prices come from batch `GET /tokens/prices`, then the market `best_bid`/`best_ask` midpoint or `last_trade_price`, and live from the public `pred.bbo` WebSocket channel.
- Responses use `Cache-Control: private, no-store`.
- The previous prediction-market provider, its import jobs, SDKs, wallet setup,
  and proxy endpoints have been removed. Import and snapshot jobs stay off.

## Private trading (Broker API)

- Private Gate requests are signed on the web server with the Broker API key
  (`GATE_BROKER_API_KEY`, `GATE_BROKER_API_SECRET`, server-only) using
  HMAC-SHA512, via `@backspace/markets/server`. See `apps/web/DEPLOY.md`.
- `/api/native/markets/orders` posts to `/api/v4/broker/prediction/orders`
  (or `/api/v4/broker/event_contracts/orders` with `product=event_contracts`).
  `orderMode` maps to `order_mode` (LIMIT | MARKET) and `orderType` to
  `order_type` (GTC | GTD | FOK | FAK). Market buys use MARKET + FOK + `total_cost`.
  Gate's `processing` status means accepted, not filled.
- `/api/native/markets/portfolio` reads Broker `assets` and `positions`
  (plus `balance` for Event Contracts).
- The `GATE_ACCOUNT_GATEWAY_*` placeholder gateway is removed and deprecated.

## Not in this slice

- Gate wallet registration (sign-message → wallet signature → register → resolve).
  Until it ships, private routes return 409 because no user has a registered
  wallet; with Broker keys unset they return 503.
- Deposits, withdrawals and any funding UI. Deposits and withdrawals are planned
  for the first trading release; see `docs/wallet-system-design.md`.
- Private WebSocket channels (`pred.orders`, `pred.positions`, ...), claims,
  cancel and close-position.

## Runtime configuration

- `GATE_DEXBUILDER_API_URL` (optional) overrides `https://api.dexbuilder.com` for a Gate sandbox.
- `GATE_BROKER_API_KEY`, `GATE_BROKER_API_SECRET`: server-only Broker credentials. Not set yet.

## Verification

- `pnpm --filter @backspace/markets test` runs the Broker signing tests
  (dummy secret only) against the documented fixtures.
- `packages/markets` typechecks under TypeScript 4.6, which apps/web uses.
- This environment cannot reach Gate's production API, so the first live
  response validation (including price-history `from`/`to` units) happens on Railway.
