# Backspace Markets: Gate DexBuilder foundation

Backspace Markets lives inside the existing social product at `/markets`.

## Current implementation

- `/markets` is public and displays Gate DexBuilder markets without requiring sign-in.
- `/api/markets` requests the live Gate catalog and does not read or write market rows.
- `/api/markets/{market_id}` requests the live Gate market definition.
- Outcome prices update from Gate's public `pred.bbo` WebSocket channel.
- Responses use `Cache-Control: private, no-store`; Gate remains the market-data authority.
- The previous prediction-market provider, its import jobs, SDKs, wallet setup,
  and proxy endpoints have been removed.
- Gate trading remains disabled until Gate documents Builder user registration and authenticated credential issuance.

## Runtime configuration

`GATE_DEXBUILDER_API_URL` can override the default `https://api.dexbuilder.com` base URL for a Gate sandbox.

## Verification

- JavaScript and TypeScript syntax for the changed market files was parsed successfully with Babel's TypeScript/JSX parser.
- `git diff --check` passes.
- A full workspace type check requires the repository dependencies, which are unavailable in this restricted environment.
- This environment cannot connect to Gate's production API, so Railway must perform the first live response validation.

## Next integration stage

After Gate supplies the account-registration and authentication contract, add server-side authenticated REST proxies and private WebSocket handling for orders, fills, positions, settlements, and claims. Backspace should retain only social references and derived reputation; Gate remains authoritative for financial records.

