# @backspace/landing

Marketing landing page. Waitlist signup + pre-launch username reservation.

- `pnpm --filter @backspace/landing dev` — local dev on port 3001
- `pnpm --filter @backspace/landing build && pnpm --filter @backspace/landing start` — prod
- Shares `@backspace/db` and `@backspace/usernames` with `apps/web`; a
  reservation here is honored on Privy signup in the main app
  (see `apps/web/src/pages/api/user/index.ts` and
  `apps/web/src/hooks/useOnboarding.ts`).

See `DEPLOY.md` for Railway config and env vars.
