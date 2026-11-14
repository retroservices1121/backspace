# Backspace Native

The new iOS and Android Backspace app. This is a native Expo Router application (Expo SDK 57, React Native 0.86) with a new app identity:

- iOS bundle identifier: `to.backspace.app`
- Android package: `to.backspace.app`
- Expo slug: `backspace-native`

It does not wrap the existing website. Screens are built with React Native components and follow the current Backspace mobile design.

## Current foundation

- Native email-code sign-in (Privy) with encrypted session persistence
- Communities, Messages and Profile tabs
- Profile reads the Backspace user from `GET /api/user/self`
- Shared brand tokens (`@backspace/shared`) and typed API client (`@backspace/api-client`)
- Gate markets and portfolio, behind a feature flag (off by default)

## Tabs and routes

Routes live in `src/app/` (Expo Router):

| Route | What it is |
| --- | --- |
| `index.tsx` | Redirects to `/(tabs)/communities` when signed in, otherwise to `/sign-in` |
| `sign-in.tsx` | Email + one-time code sign-in. Shows a setup notice when the Privy IDs are missing |
| `(tabs)/communities/` | Communities tab (own Stack) |
| `(tabs)/messages/` | Messages tab (own Stack) |
| `(tabs)/profile/` | Profile tab (own Stack): name, @username, sign out |
| `(tabs)/markets.tsx`, `(tabs)/portfolio.tsx`, `market/[id].tsx` | Thin routes for the markets feature; redirect to `/` when the flag is off |

The tab bar is **Communities · Messages · Profile**. With the markets flag on it is **Communities · Messages · Markets · Portfolio · Profile**. Tab bar height and padding follow the device safe-area insets. Android hardware back uses the default Expo Router behaviour: it pops the current stack, and at a tab root it exits the app.

## Feature flags

| Variable | Default | Effect |
| --- | --- | --- |
| `EXPO_PUBLIC_FEATURE_MARKETS` | `false` | `true` shows the Markets and Portfolio tabs and enables `market/[id]`. Any other value hides them, and those routes redirect to `/`. |

Flags are read in `src/lib/flags.ts`. `EXPO_PUBLIC_*` values are inlined at bundle time, so restart Metro (or rebuild) after changing them.

All Gate and market UI lives in `src/features/markets/` (screens, cards, chart, trade ticket, live socket hook, and portfolio/order API calls). The Gate REST and WebSocket client is `src/lib/gate.ts`. No social screen imports either one.

## Workspace packages

- **`packages/shared` (`@backspace/shared`)**: brand colour, radius and spacing tokens, matching the "new design tokens" in `apps/web/tailwind.config.js`. It is source-only TypeScript and stays TS 4.6 compatible so `apps/web` can use it. `src/constants/theme.ts` re-exports it.
- **`packages/api-client` (`@backspace/api-client`)**: `createApiClient({ baseUrl, getToken, fetch })` with `request<T>(path, { method, body, schema, auth })`, zod response schemas, and endpoints such as `getSelf`. It throws `ApiError(status, message, code?)` (`401` → `unauthorized`) and never logs tokens or bodies. It has no React or Expo imports.

In the app, `src/lib/api/client.ts` builds the singleton client from `EXPO_PUBLIC_BACKSPACE_API_URL` (default `https://backspace.to/api`) and `expo/fetch`. `ApiSessionBridge` supplies the session's access token. Query keys are in `src/lib/api/query-keys.ts`. `useMe()` (`src/hooks/use-me.ts`) loads the signed-in user under the key `['me']`. `null` means the person is signed in but has not created a Backspace profile yet.

Metro resolves both packages through the pnpm workspace with the default Expo SDK 57 monorepo support. `metro.config.js` keeps a small custom `resolveRequest` for `isows`, `zustand` and `jose`. It also adds the markets flag to Metro's `cacheVersion`, because Metro's transform cache does not otherwise notice `EXPO_PUBLIC_*` changes and would reuse modules built with the old flag value. If you add another build-time flag, add it there too.

## Run locally

```bash
pnpm install
pnpm dev:native
```

Copy `.env.example` to `.env.local`. Create a mobile app client for the new bundle `to.backspace.app` in the Backspace identity project, then set `EXPO_PUBLIC_PRIVY_APP_ID` and `EXPO_PUBLIC_PRIVY_CLIENT_ID`.

Private Gate access is deliberately routed through the web API. Configure `GATE_ACCOUNT_GATEWAY_URL` and `GATE_ACCOUNT_GATEWAY_TOKEN` on the server after Gate enables Builder user-account provisioning. The gateway must map the verified `X-Backspace-User` identity to that user's Gate account and sign Gate requests without returning API secrets to the app.

## Checks

Run from the repository root. If pnpm fails on the corepack cache, export `COREPACK_HOME=/tmp/corepack` first.

```bash
pnpm install
pnpm --filter @backspace/native typecheck
pnpm --filter @backspace/native lint
(cd packages/shared && npx -p typescript@4.6 tsc --noEmit -p .)
(cd packages/api-client && ../../apps/native/node_modules/.bin/tsc --noEmit -p .)
(cd apps/native && npx expo-doctor)
(cd apps/native && npx expo config --type public --json > /tmp/bs-p0-config.json)
(cd apps/native && npx expo export --platform ios --output-dir /tmp/bs-p0-export-ios)
(cd apps/native && npx expo export --platform android --output-dir /tmp/bs-p0-export-android)
(cd apps/native && EXPO_PUBLIC_FEATURE_MARKETS=true npx expo export --platform android --output-dir /tmp/bs-p0-export-markets)
```

Configure native behaviour in `app.json` only. Do not commit `ios/` or `android/` (no `expo prebuild`).

## Build

The included `eas.json` defines development, internal-preview, and production profiles, and uses remote app versioning. Link a new EAS project before the first cloud build; no existing mobile project ID is reused.
