import { z } from 'zod';

/**
 * GET /api/waitlist/me (apps/web/src/pages/api/waitlist/me.ts).
 * `found: false` when the caller's verified email has no waitlist row.
 */
export const waitlistMeResponseSchema = z
  .object({
    found: z.boolean(),
    username: z.string().nullable().optional(),
    claimed: z.boolean().optional(),
  })
  .loose();

/**
 * GET /api/waitlist/check?u= (apps/web/src/pages/api/waitlist/check.ts).
 * Consolidated check: format rules, taken, reserved, and other people's waitlist reservations.
 * The caller's own waitlist reservation counts as available.
 */
export const usernameCheckResponseSchema = z
  .object({
    available: z.boolean(),
    normalized: z.string().optional(),
    reason: z.string().optional(),
    message: z.string().optional(),
  })
  .loose();

export type WaitlistMeResponse = z.infer<typeof waitlistMeResponseSchema>;
export type UsernameCheckResponse = z.infer<typeof usernameCheckResponseSchema>;

/** Body of POST /api/user, shaped like the web onboarding client (apps/web/src/hooks/useOnboarding.ts). */
export interface CreateUserBody {
  username: string;
  /** Display name. */
  name: string;
  /** Privy user id (DID). */
  authId: string;
  uuid: string;
}

/** Body of POST /api/private. `lastName` may be empty (the Prisma column has a default). */
export interface CreatePrivateBody {
  user: { connect: { authId: string } };
  firstName: string;
  lastName: string;
  email?: string;
}

/** Body of POST /api/userstate. */
export interface CreateUserStateBody {
  user: { connect: { authId: string } };
  onboarded: boolean;
}
