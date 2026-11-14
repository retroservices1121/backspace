# Backspace Native

The new iOS and Android Backspace app. This is a native Expo Router application (Expo SDK 57, React Native 0.86) with a new app identity:

- iOS bundle identifier: `to.backspace.app`
- Android package: `to.backspace.app`
- Expo slug: `backspace-native`

It does not wrap the existing website. Screens are built with React Native components and follow the current Backspace mobile design.

## Current foundation

- Native email-code sign-in (Privy) with encrypted session persistence
- Sign-in is required: every tab and screen sits behind one auth gate
- Minimal onboarding (username + display name) for people without a Backspace profile
- Communities, Messages and Profile tabs
- Profile reads the Backspace user from `GET /api/user/self`
- Shared brand tokens (`@backspace/shared`) and typed API client (`@backspace/api-client`)
- Gate markets and portfolio, behind a feature flag (off by default)

## Tabs and routes

Routes live in `src/app/` (Expo Router):

| Route | What it is |
| --- | --- |
| `index.tsx` | Gate entry and fallback (never protected). Forwards to `/sign-in`, `/onboarding` or `/(tabs)/communities`; otherwise shows the branded loading state or a retry state |
| `sign-in.tsx` | Email + one-time code sign-in. Heading is the Backspace wordmark with "Sign in to Backspace". Shows a setup notice when the Privy IDs are missing. No close/back control |
| `onboarding.tsx` | First-run profile setup (username + display name). No tab bar, no back control |
| `(tabs)/communities/` | Communities tab (own Stack) |
| `(tabs)/messages/` | Messages tab (own Stack) |
| `(tabs)/profile/` | Profile tab (own Stack): name, @username, sign out |
| `(tabs)/markets.tsx`, `(tabs)/portfolio.tsx`, `market/[id].tsx` | Thin routes for the markets feature; redirect to `/` when the flag is off |

The tab bar is **Communities · Messages · Profile**. With the markets flag on it is **Communities · Messages · Markets · Portfolio · Profile**. Tab bar height and padding follow the device safe-area insets. Android hardware back uses the default tab `backBehavior` (`firstRoute`; `(tabs)/_layout.tsx` does not override it):

- Inside a tab, back first pops that tab's own stack.
- At the root of Messages or Profile (or Markets/Portfolio with the flag on), back switches to the Communities tab instead of exiting.
- At the root of Communities, back exits the app.

## Auth gate

Signed-out people cannot open any tab. `AuthGateProvider` (`src/auth/auth-gate.tsx`) sits inside both the session provider and `QueryClientProvider` in `src/app/_layout.tsx`, and derives a single status from `useSession()` and `useMe()`:

| Status | When | Reachable routes |
| --- | --- | --- |
| `loading` | Session restoring, or `useMe` has not answered yet | `index` only (branded wordmark + spinner; the tabs never flash) |
| `signed-out` | No session (including when sign-in is not configured) | `/sign-in` |
| `needs-onboarding` | `useMe()` succeeded with JSON `null` | `/onboarding` |
| `ready` | Signed in with a Backspace profile | `(tabs)` (Communities, Messages, Profile, and Markets/Portfolio when flagged) and `market/[id]` |
| `error` | `useMe()` failed with anything other than 401 | `index` only, with "Try again" and "Use a different account" (never the onboarding form) |
| `expired` | `useMe()` returned 401 and clearing the session failed | `index` only, with "Sign in again" |

A 401 from `/user/self` signs the person out automatically, so they land on sign-in.

The root `Stack` wraps each group of routes in `Stack.Protected` keyed on that status. `index` is listed first and is never protected. Whenever a guard denies a route (cold start, deep link, hardware/system back, or a guard flipping), Expo Router falls back to `index`, which forwards to the right place. When a guard turns false, Expo Router also drops that route's history. So after sign-out, back cannot return to the tabs, and back cannot skip onboarding. A deep link opened while signed out or mid-onboarding is not resumed afterwards: the person lands on Communities.

- Sign-in has no close control. After the code is verified, the sign-in guard turns off and the gate sends the person to onboarding or Communities. A signed-in person who opens `/sign-in` is forwarded the same way.
- Sign out (Profile, or "Use a different account" on onboarding/error) calls the gate's `signOut()`, which ends the Privy session and clears the query cache, then replaces to `/sign-in`.

## Onboarding

`src/app/onboarding.tsx` mirrors the web onboarding (`apps/web/src/pages/auth/onboarding.tsx`, `hooks/useOnboarding.ts`) with a minimal form:

1. Prefills the username from `GET /api/waitlist/me` when `found` and a username is present.
2. Validates locally with `@backspace/usernames` (3–20 characters, starts with a letter, letters/numbers/single underscores, not reserved or trademarked). A handle matching the caller's own waitlist reservation skips the local check, because the server treats it as available. Display name is required (max 50).
3. Calls `GET /api/waitlist/check?u=` (format, taken, reserved) before submitting.
4. `POST /api/user` with `{ username, name, authId, uuid }` (`name` is the display name, `authId` the Privy user id, `uuid` from `expo-crypto`), then `POST /api/private` (first token of the display name as `firstName`, the rest as `lastName`, plus email) and `POST /api/userstate` (`onboarded: true`) in parallel. These are `completeOnboarding()` and related helpers in `@backspace/api-client`.
5. Seeds and refetches `['me']`, then replaces to Communities.

Errors are shown inline. The private-beta 403 `not_on_waitlist` shows "Backspace is in private beta — join the waitlist to get access.", and a 409 waitlist reservation conflict shows on the username field. "Use a different account" signs out and returns to sign-in.

Known gaps compared with web:

- No avatar upload, and no default-avatar `POST /api/media` row.
- No date of birth.
- `/private` and `/userstate` failures after the User row exists are not retried or shown, because the profile is already usable and retrying `POST /api/user` would collide with the new row.
- Account creation still depends on the server's waitlist gate.

## Feature flags

| Variable | Default | Effect |
| --- | --- | --- |
| `EXPO_PUBLIC_FEATURE_MARKETS` | `false` | `true` shows the Markets and Portfolio tabs and enables `market/[id]`. Any other value hides them, and those routes redirect to `/`. |

Flags are read in `src/lib/flags.ts`. `EXPO_PUBLIC_*` values are inlined at bundle time, so restart Metro (or rebuild) after changing them.

All Gate and market UI lives in `src/features/markets/` (screens, cards, chart, trade ticket, live socket hook, and portfolio/order API calls). The Gate REST and WebSocket client is `src/lib/gate.ts`. No social screen imports either one.

## Workspace packages

- **`packages/shared` (`@backspace/shared`)**: brand colour, radius and spacing tokens, matching the "new design tokens" in `apps/web/tailwind.config.js`. It is source-only TypeScript and stays TS 4.6 compatible so `apps/web` can use it. `src/constants/theme.ts` re-exports it.
- **`packages/api-client` (`@backspace/api-client`)**: `createApiClient({ baseUrl, getToken, fetch })` with `request<T>(path, { method, body, schema, auth })`, zod response schemas, and endpoints such as `getSelf` and the onboarding helpers (`getWaitlistMe`, `checkUsername`, `completeOnboarding`). It throws `ApiError(status, message, code?)` (`401` → `unauthorized`) and never logs tokens or bodies. It has no React or Expo imports.

In the app, `src/lib/api/client.ts` builds the singleton client from `EXPO_PUBLIC_BACKSPACE_API_URL` (default `https://backspace.to/api`) and `expo/fetch`. `ApiSessionBridge` supplies the session's access token. Query keys are in `src/lib/api/query-keys.ts`. `useMe()` (`src/hooks/use-me.ts`) loads the signed-in user under the key `['me']`. `null` means the person is signed in but has not created a Backspace profile yet (the auth gate routes them to onboarding). Username rules come from the `@backspace/usernames` workspace package.

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
(cd packages/shared && npx -p typescript@4.6 tsc --noEmit -p .)   # prefix npm_config_cache=/tmp/... if npm's cache is read-only
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
