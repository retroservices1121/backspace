# Backspace Native

The new iOS and Android Backspace app. This is a native Expo Router application (Expo SDK 57, React Native 0.86) with a new app identity:

- iOS bundle identifier: `to.backspace.app`
- Android package: `to.backspace.app`
- Expo slug: `backspace-native`

It does not wrap the existing website. Screens are built with React Native components and follow the current Backspace mobile design.

## Current foundation

- Native email-code sign-in (Privy) with encrypted session persistence
- Sign-in is required: every tab and screen sits behind one auth gate
- Onboarding (profile photo, username, display name, date of birth) for people without a Backspace profile
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
| `onboarding.tsx` | First-run profile setup (photo, username, display name, date of birth). No tab bar, no back control |
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
| `needs-onboarding` | `useMe()` succeeded with JSON `null` (no User row), or with a User row whose `avatar` is null or absent | `/onboarding` |
| `ready` | Signed in with a Backspace profile that has an avatar | `(tabs)` (Communities, Messages, Profile, and Markets/Portfolio when flagged) and `market/[id]` |
| `error` | `useMe()` failed with anything other than 401 | `index` only, with "Try again" and "Use a different account" (never the onboarding form) |
| `expired` | `useMe()` returned 401 and clearing the session failed | `index` only, with "Sign in again" |

A 401 from `/user/self` signs the person out automatically, so they land on sign-in.

The root `Stack` wraps each group of routes in `Stack.Protected` keyed on that status. `index` is listed first and is never protected. Whenever a guard denies a route (cold start, deep link, hardware/system back, or a guard flipping), Expo Router falls back to `index`, which forwards to the right place. When a guard turns false, Expo Router also drops that route's history. So after sign-out, back cannot return to the tabs, and back cannot skip onboarding. A deep link opened while signed out or mid-onboarding is not resumed afterwards: the person lands on Communities.

- Sign-in has no close control. After the code is verified, the sign-in guard turns off and the gate sends the person to onboarding or Communities. A signed-in person who opens `/sign-in` is forwarded the same way.
- Sign out (Profile, or "Use a different account" on onboarding/error) calls the gate's `signOut()`, which ends the Privy session and clears the query cache, then replaces to `/sign-in`.

## Onboarding

`src/app/onboarding.tsx` mirrors the web onboarding (`apps/web/src/pages/auth/onboarding.tsx`, `hooks/useOnboarding.ts`, `components/Auth/OnboardingForm.tsx`).

Form:

- **Profile photo** (optional, `src/components/onboarding/avatar-picker.tsx`): picked from the photo library with `expo-image-picker` (square crop, no camera), previewed, and removable so the default avatar is still available. Files over 10 MB (web `MAX_BYTES`) are rejected.
- **Username**: validated locally with `@backspace/usernames` (3–20 characters, starts with a letter, letters/numbers/single underscores, not on that package's reserved or trademark lists).
- **Display name**: required, max 50.
- **Date of Birth** (optional, `src/components/onboarding/date-of-birth-field.tsx`): the SDK 57 `@expo/ui/community/datetime-picker` drop-in (inline wheel on iOS, Material 3 dialog on Android; hidden on web). No future dates, earliest year 121 years back (web `DatePicker` shows 122 years). Like web, there is no minimum-age rule.

Submit (`completeOnboarding()` in `@backspace/api-client`, in this order):

1. `POST /api/user` with `{ username, name, authId, uuid }` (`name` is the display name, `authId` the Privy user id, `uuid` from `expo-crypto`).
2. Avatar, now that the User row exists (`/media/upload-url` looks the caller up):
   - Photo picked: `POST /api/media/upload-url` with `{ type: 'AVATAR', id: uuid, fileName, contentType }`, then a `PUT` of the bytes to the returned presigned R2 URL with only `Content-Type` set (no Bearer token, not through the API client; `src/lib/media/avatar-upload.ts`), then `POST /api/media` with `{ type: 'AVATAR', host: 'R2', path, fileExtension, avatarUser: { connect: { authId } } }`.
   - No photo: `POST /api/media` with `path: default/user/<1–16>.png` and `fileExtension: 'PNG'` (web `defaultAvatar()`), with no upload.
   - **Deliberate difference from web:** if any step of the photo upload fails, native writes the default avatar row instead and, once that write succeeds, shows "Photo not uploaded". Web writes no Media row in that case.
   - If no Media row could be written at all (photo and default both failed), nothing else runs and the screen stays on onboarding (step 5).
3. `POST /api/private` (first token of the display name as `firstName`, the rest as `lastName`, email, and `dobYear`/`dobMonth`/`dobDay` only when a date was picked; the server defaults to 1/1/1900 otherwise) and `POST /api/userstate` (`onboarded: true`) in parallel.
   `createPrivate()` rejects unless the response has a non-null `user`: the route answers `200 {}` when Prisma rejects the row, and that counts as a failure (step 5).
4. Only once a Media row exists and `/private` succeeded does it refetch `['me']` (never seeded with the `POST /api/user` payload, which has no avatar) and, once the refetched profile has an avatar, replace to Communities. The auth gate leaves onboarding only when `['me']` has an avatar. If the refetch fails, the screen stays with nothing outstanding and "Try again" reloads it. A failed `/userstate` alone is best effort.
5. Retry: if the Media row or `/private` failed after `POST /api/user` succeeded, the screen keeps the created user, shows the failure inline, locks the username and display name, and turns the button into "Try again", which calls `runOnboardingFollowUps()` with only the outstanding writes (media first). `POST /api/user` is never repeated. When only `/private` is outstanding, "Continue without saving these details" leaves without it.
6. Resume: if the app restarts, or the person signs out and back into the same account, before the Media row exists, `/user/self` returns their User row with no `avatar`, so the gate sends them back to onboarding. The screen prefills and locks the username and display name from that row, reuses its `uuid` (and the session's `authId`), and the button ("Finish setup") runs only `runOnboardingFollowUps()`: media, plus `/private` if the row has no `private` and `/userstate` if `state.onboarded` is not set.

The server decides whether a profile can be created. If `POST /api/user` fails, the server's `message` is shown inline as-is; the client does not special-case error codes. "Use a different account" signs out and returns to sign-in.

Known gaps compared with web:

- A failed `/userstate` is not retried or shown.
- The photo picker and date picker are native modules (`expo-image-picker`, `@expo/ui`), so they need a development build, not Expo Go.

### Permissions

- iOS: only `NSPhotoLibraryUsageDescription` ("Backspace uses your photo library so you can choose a profile photo."), set by the `expo-image-picker` plugin in `app.json`. Camera and microphone are disabled in the plugin, so no camera or microphone strings are added.
- Android: no new permissions. `blockedPermissions` keeps `RECORD_AUDIO` and also blocks `CAMERA` and the legacy `READ_EXTERNAL_STORAGE`/`WRITE_EXTERNAL_STORAGE` that the image-picker library manifest adds. The system photo picker needs none of them, and the app never calls `requestMediaLibraryPermissionsAsync`.

## Feature flags

| Variable | Default | Effect |
| --- | --- | --- |
| `EXPO_PUBLIC_FEATURE_MARKETS` | `false` | `true` shows the Markets and Portfolio tabs and enables `market/[id]`. Any other value hides them, and those routes redirect to `/`. |

Flags are read in `src/lib/flags.ts`. `EXPO_PUBLIC_*` values are inlined at bundle time, so restart Metro (or rebuild) after changing them.

All Gate and market UI lives in `src/features/markets/` (screens, cards, chart, trade ticket, live socket hook, and portfolio/order API calls). The Gate REST and WebSocket client is `src/lib/gate.ts`. No social screen imports either one.

## Workspace packages

- **`packages/shared` (`@backspace/shared`)**: brand colour, radius and spacing tokens, matching the "new design tokens" in `apps/web/tailwind.config.js`. It is source-only TypeScript and stays TS 4.6 compatible so `apps/web` can use it. `src/constants/theme.ts` re-exports it.
- **`packages/api-client` (`@backspace/api-client`)**: `createApiClient({ baseUrl, getToken, fetch })` with `request<T>(path, { method, body, schema, auth })`, zod response schemas, and endpoints such as `getSelf` and the onboarding helpers (`completeOnboarding`, `createUser`, `createPrivate`, `createUserState`) and avatar media helpers (`createUploadUrl`, `createAvatarMedia`, `createDefaultAvatarMedia`, `MAX_AVATAR_BYTES`). It throws `ApiError(status, message, code?)` (`401` → `unauthorized`) and never logs tokens or bodies. It has no React or Expo imports.

In the app, `src/lib/api/client.ts` builds the singleton client from `EXPO_PUBLIC_BACKSPACE_API_URL` (default `https://backspace.to/api`) and `expo/fetch`. `ApiSessionBridge` supplies the session's access token. Query keys are in `src/lib/api/query-keys.ts`. `useMe()` (`src/hooks/use-me.ts`) loads the signed-in user under the key `['me']`. `null` means the person is signed in but has not created a Backspace profile yet; that, or a profile with no `avatar`, makes the auth gate route them to onboarding. Username rules come from the `@backspace/usernames` workspace package.

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
