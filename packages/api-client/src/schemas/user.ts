import { z } from 'zod';

/** Prisma ids are BigInt and may serialise as a string or a number. */
export const idSchema = z.union([z.string(), z.number()]).transform(String);

/** A related row included by GET /api/user/self; only its presence matters here. */
const relatedRowSchema = z.object({}).loose();

/**
 * Backspace User row as returned by GET /api/user/self (apps/web/src/pages/api/user/self.ts).
 * Only uuid, username and name are required; anything else is optional and unknown keys pass through.
 * `avatar`, `private` and `state` are relations web includes in `User.Self.include`; each is null when
 * the row does not exist, and absent from responses that do not include it (e.g. POST /user).
 */
export const userSchema = z
  .object({
    id: idSchema.optional(),
    uuid: z.string(),
    username: z.string(),
    name: z.string(),
    bio: z.string().optional(),
    verified: z.boolean().optional(),
    accountType: z.string().optional(),
    createdAt: z.string().optional(),
    featuredCommunityId: idSchema.nullable().optional(),
    avatar: relatedRowSchema.nullable().optional(),
    private: relatedRowSchema.nullable().optional(),
    state: z.object({ onboarded: z.boolean().optional() }).loose().nullable().optional(),
  })
  .loose();

/** `null` means signed in with Privy but no Backspace User row yet (needs onboarding). */
export const selfResponseSchema = userSchema.nullable();

export type User = z.infer<typeof userSchema>;

/** True when the User row has an avatar Media row. Onboarding is not finished until it does. */
export function hasAvatar(user: User): boolean {
  return user.avatar !== null && user.avatar !== undefined;
}
export type SelfResponse = z.infer<typeof selfResponseSchema>;
