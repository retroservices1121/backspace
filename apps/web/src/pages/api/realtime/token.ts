// POST /api/realtime/token
//
// Mints a short-lived Ably TokenRequest for the authenticated
// browser. The Privy session decides clientId — the browser cannot
// claim a clientId of its choosing.
//
// The Ably client uses authUrl to call this on every reconnect /
// token expiry. The route is intentionally narrow: GET is rejected
// so tokens aren't fetchable via a stray browser navigation.

import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { createTokenRequest } from '@src/lib/ablyServer';
import HttpStatus from 'http-status-codes';

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .post(async (req, res) => {
    if (!req.authId) {
      res.status(HttpStatus.UNAUTHORIZED).end('Not authorized');
      return;
    }
    // The clientId we sign into the token is the Privy DID stored
    // on User.authId. Fall back to req.authId if the User row isn't
    // resolvable yet (e.g. mid-onboarding) so realtime still works
    // for the bootstrap flow.
    let clientId = req.authId;
    try {
      const user = await getUserByAuthId(req.authId, true);
      if (user?.authId) clientId = user.authId;
    } catch {
      // Non-fatal — fall back to the raw req.authId already set.
    }

    try {
      const tokenRequest = await createTokenRequest(clientId);
      res.json(tokenRequest);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('createTokenRequest failed', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end(
        err instanceof Error ? err.message : 'Failed to mint token',
      );
    }
  });

export default handler;
