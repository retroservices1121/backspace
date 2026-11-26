# Backspace Native

The new iOS and Android Backspace app. This is a native Expo Router application with a new app identity:

- iOS bundle identifier: `to.backspace.app`
- Android package: `to.backspace.app`
- Expo slug: `backspace-native`

It does not wrap the existing website. Screens are built with React Native components and follow the current Backspace mobile design.

## Current foundation

- Native Home, Markets, compose, Portfolio, and Profile tabs
- Live Gate DexBuilder prediction-market catalog
- Gate events grouped with their related markets
- Market details with live probability history, BBO, order-book depth, and recent trades
- REST snapshot recovery plus Gate WebSocket updates
- Native email-code sign-in with encrypted session persistence
- Authenticated live portfolio and reviewed order-entry surfaces
- Server-only boundary for Gate account credentials
- No local persistence of market or trading data

## Run locally

```bash
pnpm install
pnpm dev:native
```

Copy `.env.example` to `.env.local`. Create a mobile app client for the new bundle `to.backspace.app` in the Backspace identity project, then set `EXPO_PUBLIC_PRIVY_APP_ID` and `EXPO_PUBLIC_PRIVY_CLIENT_ID`.

Private Gate access is deliberately routed through the web API (`/api/native/markets/*`). The web server signs Gate DexBuilder Broker requests with the server-only `GATE_BROKER_API_KEY` and `GATE_BROKER_API_SECRET`; the app never receives a Gate key, secret or signature, and those names must never be added as `EXPO_PUBLIC_*` variables. The old `GATE_ACCOUNT_GATEWAY_URL` / `GATE_ACCOUNT_GATEWAY_TOKEN` gateway is deprecated and no longer read. Balances and trading stay unavailable until Gate wallet registration ships; deposits and withdrawals are not built yet.

## Build

The included `eas.json` defines development, internal-preview, and production profiles. Link a new EAS project before the first cloud build; no existing mobile project ID is reused.
