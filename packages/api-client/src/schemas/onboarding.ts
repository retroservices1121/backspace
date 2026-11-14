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
