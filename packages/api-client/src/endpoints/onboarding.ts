import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import {
  type CreatePrivateBody,
  type CreateUserBody,
  type CreateUserStateBody,
  usernameCheckResponseSchema,
  type UsernameCheckResponse,
  waitlistMeResponseSchema,
  type WaitlistMeResponse,
} from '../schemas/onboarding';
import { selfResponseSchema, type User } from '../schemas/user';

/** GET /waitlist/me: the caller's waitlist reservation (used to prefill the username). */
export function getWaitlistMe(client: ApiClient): Promise<WaitlistMeResponse> {
  return client.request('/waitlist/me', { schema: waitlistMeResponseSchema });
}

/** GET /waitlist/check?u=: server-side username availability for the signed-in caller. */
export function checkUsername(client: ApiClient, username: string): Promise<UsernameCheckResponse> {
  return client.request(`/waitlist/check?u=${encodeURIComponent(username)}`, { schema: usernameCheckResponseSchema });
}

/**
 * POST /user: creates the Backspace User row.
 * Returns 403 `not_on_waitlist` during the private beta and 409 `waitlist_reserved` when someone else
 * holds the handle. A JSON `null` body means the row was not created.
 */
export async function createUser(client: ApiClient, body: CreateUserBody): Promise<User> {
  const user = await client.request('/user', { method: 'POST', body, schema: selfResponseSchema });
  if (!user) throw new ApiError(500, 'Your profile could not be created. Try again.', 'user_not_created');
  return user;
}

/** POST /private: private details (first/last name, email). */
export function createPrivate(client: ApiClient, body: CreatePrivateBody): Promise<unknown> {
  return client.request('/private', { method: 'POST', body });
}

/** POST /userstate: marks the user as onboarded. */
export function createUserState(client: ApiClient, body: CreateUserStateBody): Promise<unknown> {
  return client.request('/userstate', { method: 'POST', body });
}

export interface CompleteOnboardingInput {
  /** Privy user id (DID). */
  authId: string;
  username: string;
  displayName: string;
  /** Freshly generated v4 UUID for the new User row. */
  uuid: string;
  email?: string | null;
}

export interface CompleteOnboardingResult {
  user: User;
  /** Follow-up writes that failed after the User row was created (`'private'`, `'userstate'`). */
  failedFollowUps: ('private' | 'userstate')[];
}

/** Splits a display name into first name (first token) and last name (the remainder, possibly empty). */
export function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

/**
 * Mirrors the web onboarding submit (apps/web/src/hooks/useOnboarding.ts) without the avatar media row:
 * POST /user, then POST /private and POST /userstate in parallel.
 *
 * Once the User row exists the profile is usable, so the follow-ups are best effort. Their failures
 * are reported in `failedFollowUps` instead of thrown: retrying POST /user would only collide with
 * the row that was just created.
 */
export async function completeOnboarding(client: ApiClient, input: CompleteOnboardingInput): Promise<CompleteOnboardingResult> {
  const user = await createUser(client, { username: input.username, name: input.displayName, authId: input.authId, uuid: input.uuid });
  const connect = { connect: { authId: input.authId } };
  const { firstName, lastName } = splitDisplayName(input.displayName);
  const [privateResult, stateResult] = await Promise.allSettled([
    createPrivate(client, { user: connect, firstName, lastName, ...(input.email ? { email: input.email } : {}) }),
    createUserState(client, { user: connect, onboarded: true }),
  ]);
  const failedFollowUps: CompleteOnboardingResult['failedFollowUps'] = [];
  if (privateResult.status === 'rejected') failedFollowUps.push('private');
  if (stateResult.status === 'rejected') failedFollowUps.push('userstate');
  return { user, failedFollowUps };
}
