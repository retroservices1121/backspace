import { headers } from 'next/headers';
import { PlatformUserType, prisma } from '@backspace/db';
import { verifyPrivyToken } from '@backspace/auth';

/**
 * Admin role gate for server components / API routes.
 *
 * Resolves the calling user from a Privy session token in the Authorization
 * header, then verifies their User row has a sufficient platformPermission.
 * Returns the User on success, throws on failure — caller decides whether to
 * 401/403 or redirect.
 *
 * Note: app-level Privy enforcement is the FIRST line; the platformPermission
 * check is the SECOND. A leaked Privy admin-app token is useless without the
 * matching platformPermission row in Postgres.
 */
const ADMIN_ROLES: PlatformUserType[] = [
  PlatformUserType.MODERATOR,
  PlatformUserType.ELEVATED,
  PlatformUserType.ADMIN,
];

export async function requireAdmin() {
  const auth = headers().get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!bearer) throw new Error('UNAUTHORIZED');

  const claims = await verifyPrivyToken(bearer, {
    appId: process.env.ADMIN_PRIVY_APP_ID!,
    appSecret: process.env.ADMIN_PRIVY_APP_SECRET!,
  });

  // Privy `sub` is the stable user identifier — the User row's authId column
  // is what we map to (replacing Firebase UID semantics).
  const user = await prisma.user.findUnique({ where: { authId: claims.sub } });
  if (!user) throw new Error('UNAUTHORIZED');
  if (!ADMIN_ROLES.includes(user.platformPermission)) throw new Error('FORBIDDEN');

  return user;
}
