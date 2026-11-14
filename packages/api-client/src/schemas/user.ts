import { z } from 'zod';

/** Prisma ids are BigInt and may serialise as a string or a number. */
export const idSchema = z.union([z.string(), z.number()]).transform(String);

/**
 * Backspace User row as returned by GET /api/user/self (apps/web/src/pages/api/user/self.ts).
 * Only uuid, username and name are required; anything else is optional and unknown keys pass through.
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
  })
  .passthrough();

/** `null` means signed in with Privy but no Backspace User row yet (needs onboarding). */
export const selfResponseSchema = userSchema.nullable();

export type User = z.infer<typeof userSchema>;
export type SelfResponse = z.infer<typeof selfResponseSchema>;
