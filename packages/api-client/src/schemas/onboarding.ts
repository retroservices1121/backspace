import { z } from 'zod';

/** Body of POST /api/user, shaped like the web onboarding client (apps/web/src/hooks/useOnboarding.ts). */
export interface CreateUserBody {
  username: string;
  /** Display name. */
  name: string;
  /** Privy user id (DID). */
  authId: string;
  uuid: string;
}

/**
 * Body of POST /api/private. `lastName` may be empty (the Prisma column has a default). The date of
 * birth is optional and sent only when picked, like web; the Prisma columns default to 1/1/1900.
 */
export interface CreatePrivateBody {
  user: { connect: { authId: string } };
  firstName: string;
  lastName: string;
  email?: string;
  dobYear?: number;
  /** 1–12. */
  dobMonth?: number;
  dobDay?: number;
}

/** A calendar date with a 1-based month, like web's `SimpleDate`. */
export interface SimpleDate {
  year: number;
  month: number;
  day: number;
}

/** Body of POST /api/userstate. */
export interface CreateUserStateBody {
  user: { connect: { authId: string } };
  onboarded: boolean;
}
