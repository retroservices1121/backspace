import { RESERVED_BLOCKLIST, TRADEMARK_BLOCKLIST } from './blocklist';

export { RESERVED_BLOCKLIST, TRADEMARK_BLOCKLIST };

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

// Allowed: lowercase letters, digits, and a single internal underscore.
// Must start with a letter; cannot end with an underscore; no consecutive
// underscores. Chosen to be conservative — we can loosen later.
const USERNAME_REGEX = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export type UsernameRejection =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'invalid_chars'
  | 'reserved'
  | 'trademarked';

export type UsernameCheck =
  | { ok: true; normalized: string }
  | { ok: false; reason: UsernameRejection };

// Normalize the raw input to the canonical lowercase form. We never store
// the display-case as the unique key; usernameLower is the unique index.
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

// Run *all* synchronous checks: format + length + blocklists. Does NOT
// hit the database — DB-side checks (already-taken, already-reserved)
// are the caller's job.
export function validateUsernameFormat(input: string): UsernameCheck {
  const normalized = normalizeUsername(input);
  if (normalized.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  if (normalized.length < USERNAME_MIN_LENGTH) {
    return { ok: false, reason: 'too_short' };
  }
  if (normalized.length > USERNAME_MAX_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }
  if (!USERNAME_REGEX.test(normalized)) {
    return { ok: false, reason: 'invalid_chars' };
  }
  if (RESERVED_BLOCKLIST.has(normalized)) {
    return { ok: false, reason: 'reserved' };
  }
  if (TRADEMARK_BLOCKLIST.has(normalized)) {
    return { ok: false, reason: 'trademarked' };
  }
  return { ok: true, normalized };
}

// Human-readable copy for each rejection reason. Centralised so the
// landing page and the in-app onboarding form stay in sync.
export const REJECTION_COPY: Record<UsernameRejection, string> = {
  empty: 'Pick a username.',
  too_short: `At least ${USERNAME_MIN_LENGTH} characters.`,
  too_long: `At most ${USERNAME_MAX_LENGTH} characters.`,
  invalid_chars:
    'Letters, numbers, and single underscores only. Must start with a letter.',
  reserved: 'That one is reserved for the platform.',
  trademarked: 'That looks like a brand — pick something else.',
};
