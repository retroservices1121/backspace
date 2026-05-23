# Backspace Deploy — Environment Variables

Single source of truth for env vars `apps/web` needs to run end-to-end on Railway. Grouped by subsystem; keep it in sync when you add a new var anywhere in `apps/web/src` or `packages/`.

> **Server-only** vars must NOT have the `NEXT_PUBLIC_` prefix. Anything with that prefix is baked into client bundles and visible in the browser — never put a secret there.

## Database

| Var | Notes |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Railway-managed; same value lives in `packages/db/.env` for local migrations. |

## Auth — provider selection

Both providers can be configured simultaneously; the runtime selection is keyed on `NEXT_PUBLIC_CDP_PROJECT_ID`:

- **CDP** when `NEXT_PUBLIC_CDP_PROJECT_ID` is set (preferred; post-migration default).
- **Privy** when `NEXT_PUBLIC_CDP_PROJECT_ID` is unset and `NEXT_PUBLIC_PRIVY_APP_ID` is set (legacy fallback).

Flipping the provider is a Railway env-var edit + redeploy — no code change.

### Auth (CDP) — preferred

Coinbase Developer Platform: portal.cdp.coinbase.com. Create a project, generate an API key (download the JSON), generate a wallet secret. See [[project_cdp_phase0_findings]] for SDK + CLI details.

| Var | Notes |
| --- | --- |
| `NEXT_PUBLIC_CDP_PROJECT_ID` | Client CDP project id, embedded in browser bundle. Mounting this enables the CDP+wagmi provider path in `pages/_app.tsx`. |
| `CDP_API_KEY_ID` | **Server-only.** Used by `@backspace/auth`'s `verifyCdpToken` (via `lib/nextconnect.ts`). UUID or `organizations/<org>/apiKeys/<key>` format. |
| `CDP_API_KEY_SECRET` | **Server-only.** Either an Ed25519 base64 secret or an EC PEM. |
| `CDP_WALLET_SECRET` | **Server-only.** Required only for server-wallet write endpoints — end-user token verification doesn't need it. Set when we wire any server-side CDP wallet writes. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Optional. WalletConnect project id for the external-wallet WC connector. Without it, WC is skipped and the user can still link Coinbase Wallet + MetaMask via their native connectors. |

### Auth (Privy) — legacy

Kept while CDP is being validated. Once `NEXT_PUBLIC_CDP_PROJECT_ID` is set on Railway and a smoke-test sign-in succeeds, the Privy vars can be removed and Phase 1b will delete the SDK from `apps/web` and `packages/auth`.

| Var | Notes |
| --- | --- |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Client Privy app id, embedded in browser bundle. |
| `PRIVY_APP_ID` | Same value, server-only. Used by `lib/nextconnect.ts` and `pages/api/auth/claim.ts` for token verification. |
| `PRIVY_APP_SECRET` | **Server-only.** Privy JWT verification. |

## Stripe

| Var | Notes |
| --- | --- |
| `STRIPE_SECRET` | **Server-only.** Master Stripe key (`lib/stripe.ts`). |
| `STRIPE_WEBHOOK_SECRET` | **Server-only.** Signature verification for `/api/webhooks/stripe`. Set after registering the endpoint in Stripe. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Browser publishable key for Stripe.js. (Replaces the legacy `REACT_APP_STRIPE_KEY` which Next does not expose.) |

## Realtime (Ably)

| Var | Notes |
| --- | --- |
| `ABLY_API_KEY` | **Server-only.** Master Ably credential. Used by `lib/ablyServer.ts` to publish from API routes and to sign TokenRequests for the browser via `/api/realtime/token`. The browser never holds this. Rotate any historically leaked keys before deploy. |

## Storage — primary (Cloudflare R2)

| Var | Notes |
| --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare account id. |
| `R2_ACCESS_KEY_ID` | **Server-only.** R2 API token id (Account-level token, scoped to the bucket). |
| `R2_SECRET_ACCESS_KEY` | **Server-only.** R2 API token secret. |
| `R2_BUCKET` | Bucket name (e.g. `backspace-media`). |
| `R2_PUBLIC_URL` | Read origin (custom domain like `https://media.backspace.to` or `https://pub-<hash>.r2.dev`). New uploads' read URLs are `${R2_PUBLIC_URL}/${path}`. |

R2 bucket also needs a CORS rule allowing `PUT` from the app origin with `Content-Type` in `AllowedHeaders` — see Cloudflare dashboard → bucket → Settings → CORS Policy.

## Storage — legacy (kept until old Media rows are migrated)

Required only if `Media` rows with `host=FIREBASE` or `host=SUPABASE` still exist. `api2/storage.ts` lazy-imports the SDKs only on those branches, but the env vars must be present for the imports to succeed.

| Var |
| --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` |
| `NEXT_PUBLIC_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

## Operational secrets

| Var | Notes |
| --- | --- |
| `CRON_SECRET` | **Server-only.** Bearer token the Railway cron service sends to `/api/cron/import-polymarket`. The cron service config is `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/import-polymarket` on schedule `*/15 * * * *`. Generate with `openssl rand -hex 32`. |
| `ADMIN_BOOTSTRAP_SECRET` | **Server-only.** One-shot token for `POST /api/admin/bootstrap` (promotes the first signed-in caller to ADMIN), sent in the `X-Bootstrap-Secret` header (the Authorization slot already carries the Privy session token). The route refuses 409 once any admin exists; **unset this var after first admin is set** so the endpoint hard-disables. Generate with `openssl rand -hex 32`. |

## Polymarket trading

On-chain trade integration (CLOB V2). See `apps/web/src/lib/polymarket/`.

| Var | Notes |
| --- | --- |
| `NEXT_PUBLIC_POLYGON_RPC_URL` | Polygon mainnet RPC. Used by the Privy embedded wallet (chain override in `_app.tsx`) and the viem read clients. Any provider (Alchemy/Infura/public). |
| `NEXT_PUBLIC_POLYMARKET_BUILDER_CODE` | Builder order-attribution code from the Polymarket Builder Profile (polymarket.com/settings?tab=builder). Public — attached to every order, not a secret. |
| `POLYMARKET_BUILDER_API_KEY` | **Server-only.** Builder HMAC key — authenticates Backspace to Polymarket's gasless Relayer (Safe deploy + token approvals). Used only by `pages/api/polymarket/sign.ts`. |
| `POLYMARKET_BUILDER_SECRET` | **Server-only.** Builder HMAC secret. |
| `POLYMARKET_BUILDER_PASSPHRASE` | **Server-only.** Builder HMAC passphrase. |

All three `POLYMARKET_BUILDER_*` values come together from the Builder Profile. Without them the relayer signing endpoint returns 503 and trading stays disabled.

## Dflow spot trading

Solana DEX aggregator for spot swaps. See `apps/web/src/lib/dflow/`.

| Var | Notes |
| --- | --- |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana mainnet RPC. Used by the Privy embedded wallet (via `solanaClusters` in `_app.tsx`) and the browser-side broadcast path. Public RPC (`api.mainnet-beta.solana.com`) works for dev but is rate-limited; use Helius/QuickNode in prod. |
| `DFLOW_API_KEY` | **Server-only.** Required `x-api-key` for every Dflow endpoint (`/quote`, `/swap`, `/tokens`). Request from `hello@dflow.net`. Server-side proxies in `pages/api/dflow/*` inject this header so the key never reaches the client bundle. |
| `DFLOW_FEE_ACCOUNT` | **Server-only.** Backspace-controlled SPL token account that receives the `platformFeeBps` cut on every Dflow swap. Optional — without it, no platform fee is charged. |
| `NEXT_PUBLIC_DFLOW_PLATFORM_FEE_BPS` | Platform fee in basis points (e.g. `30` = 0.30%). Exposed to the client for display only; the server enforces the actual fee on every quote/swap. Defaults to `0` if unset. |

Without `DFLOW_API_KEY` the proxy routes return 503 and the Dflow flow stays disabled. `NEXT_PUBLIC_SOLANA_RPC_URL` is required at runtime to broadcast signed transactions.

## Phoenix perpetuals (Rise SDK)

Solana CLOB perpetuals via `@ellipsis-labs/rise`, routed through the Flight builder layer so every order pays our trader account a configurable bps cut. See `apps/web/src/lib/phoenix/` (Phase 1) and the Phase 0 spike at `apps/web/src/pages/Dev/phoenix-spike.tsx`.

| Var | Notes |
| --- | --- |
| `NEXT_PUBLIC_PHOENIX_BUILDER_AUTHORITY` | Base58 pubkey of the builder authority registered with Phoenix. Public by design — every Flight-wrapped order on chain carries this address. |
| `NEXT_PUBLIC_PHOENIX_BUILDER_PDA_INDEX` | PDA index for the builder trader account. Defaults to `0`. |
| `NEXT_PUBLIC_PHOENIX_BUILDER_SUBACCOUNT_INDEX` | Subaccount index for the builder trader account. Defaults to `0`. |
| `NEXT_PUBLIC_PHOENIX_BUILDER_FEE_BPS` | Default fee in basis points to set on builder registration / order routing (e.g. `25`). Phase 1 will read this when constructing the Flight config. |

Builder credentials are issued by Phoenix off-platform — contact them to register the builder authority + receive the fee-collector trader account. The same `NEXT_PUBLIC_SOLANA_RPC_URL` as the Dflow integration is reused; no separate Phoenix RPC required.

## App origin

| Var | Notes |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical app origin (e.g. `https://backspace.to`). `pages/api/billing/account` uses this for Stripe Connect onboarding redirect URLs. Falls back to the request host header if unset, but explicit is safer in prod. Must match the origin allowed in R2 CORS. |

---

## Generating secrets

```bash
openssl rand -hex 32   # ADMIN_BOOTSTRAP_SECRET
openssl rand -hex 32   # CRON_SECRET
```

## After deploy

1. Register the Stripe webhook → set `STRIPE_WEBHOOK_SECRET`, redeploy.
2. Configure the cron service in Railway → it shares `CRON_SECRET` with the web service.
3. Sign up the first user via the app, then promote them. The route
   needs **both** the Privy session token (so it knows _which_ user
   to promote) and the bootstrap secret (proving the operator
   authorized it). Easiest is from the signed-in browser's DevTools
   Console:
   ```js
   const token = document.cookie.split('; ')
     .find(r => r.startsWith('firebaseToken='))?.split('=')[1];
   fetch('/api/admin/bootstrap', {
     method: 'POST',
     headers: {
       Authorization: `Bearer ${token}`,
       'X-Bootstrap-Secret': '<ADMIN_BOOTSTRAP_SECRET>',
     },
   }).then(async r => console.log(r.status, await r.text()));
   ```
4. **Unset `ADMIN_BOOTSTRAP_SECRET`** in Railway once the first admin is set.

## Adding a new env var

When adding a new `process.env.X` reference anywhere in `apps/web/src` or `packages/`:

1. Add a row above in the appropriate section (or create a new section).
2. Note whether it's server-only (no `NEXT_PUBLIC_`) or browser-exposed.
3. Set it in the Railway service env.
