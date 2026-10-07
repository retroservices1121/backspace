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

Private Gate access is deliberately routed through the web API. Configure `GATE_ACCOUNT_GATEWAY_URL` and `GATE_ACCOUNT_GATEWAY_TOKEN` on the server after Gate enables Builder user-account provisioning. The gateway must map the verified `X-Backspace-User` identity to that user's Gate account and sign Gate requests without returning API secrets to the app.

## Build

The included `eas.json` defines development, internal-preview, and production profiles. Link a new EAS project before the first cloud build; no existing mobile project ID is reused.
