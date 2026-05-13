# Backspace Landing — Deploy Notes

Marketing landing page with waitlist + username reservation. Reads/writes
the same Postgres as `apps/web` (the social app), so reservations made
here are honored when the user later signs up via Privy.

## Railway service config

Create a new service in the same Railway project as `apps/web` and
`apps/admin`. The service runs Next.js 14 (newer than `apps/web`'s
Next 12 — required because Next 12's TypeScript dependency check is
incompatible with current `@types/react` packages).

We build via a Dockerfile rather than Railpack's auto-detection:
Railpack's monorepo install step bakes only `package.json` into the
install layer, which breaks pnpm's `workspace:*` resolution. The
Dockerfile copies the full workspace in one go before `pnpm install`.

| Setting | Value |
| --- | --- |
| Builder | **Dockerfile** (override Railpack) |
| Dockerfile Path | `apps/landing/Dockerfile` |
| Root Directory | `/` — repo root. **Must not** be `apps/landing/` (pnpm needs `pnpm-workspace.yaml` at root). |
| Install / Build / Start commands | **Leave blank.** The Dockerfile owns these. |
| Watch paths | `apps/landing/**`, `packages/**` |
| Port | `3001` (or set `PORT` env and Next will pick it up via the start script) |

Each future service (web, admin) gets its own Dockerfile in
`apps/web/Dockerfile` / `apps/admin/Dockerfile` — copy this one and
swap the workspace filter.

## Environment variables

| Var | Notes |
| --- | --- |
| `DATABASE_URL` | Same Postgres as `apps/web`. Reservations land in the `WaitlistEntry` table; the social app's user-create flow reads it back. |
| `IP_HASH_SALT` | Optional. Salt for the SHA-256 of submitter IPs stored in `WaitlistEntry.ipHash`. Defaults to a built-in string if unset; set a real value with `openssl rand -hex 16` so prod hashes aren't derivable from the source. **Server-only.** |
| `NODE_ENV` | Set to `production` by Railway automatically. |

## Domain

The brief is **chain-neutral** (per `project_backspace_pivot.md`). Use the
apex marketing domain — likely `backspacethat.com` or `backspace.to` — and
keep the social app at `app.<root>`.

## Smoke test after deploy

1. Hit `https://<landing>/` — hero, email + username inputs render, no JS
   errors in console.
2. Submit with a fresh email and a clean username — success card appears
   with a referral link.
3. Submit again with the same email — success state says "You're already
   in." (no duplicate row).
4. Try a blocked handle (e.g. `nike`, `admin`) — inline error appears
   before submit.
5. Try a taken handle (one that exists in `User.username` or another
   `WaitlistEntry`) — error after the debounced check.
6. Sign up via `apps/web` with the same email used in step 2 — the
   onboarding form pre-fills the reserved username; on submit, the
   matching `WaitlistEntry.claimedAt` is set.

## Schema reference

See `packages/db/prisma/migrations/20260513000000_add_waitlist_entry/` for
the `WaitlistEntry` table definition. Already applied to Railway DB on
2026-05-13.

## After launch

Once direct-app signup is open and the waitlist is closed:

- Stop running the landing service, or replace its UI with a "we
  launched, sign in" redirect to `apps/web`.
- Keep the `WaitlistEntry` table around — `claimedAt IS NULL` rows are
  unredeemed reservations and can be used for re-engagement emails.
