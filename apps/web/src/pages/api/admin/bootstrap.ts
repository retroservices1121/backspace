// POST /api/admin/bootstrap
//
// Promotes the authenticated caller to ADMIN. Used exactly once per
// environment to bring up the first admin — until then nobody can
// hit /api/admin/* routes (importer, etc.) because every admin
// route gates on `User.platformPermission === ADMIN`.
//
// Two layers of safety so a leaked secret doesn't let an attacker
// promote themselves on a live system:
//   1. Two-header gate:
//        Authorization:    Bearer <Privy session token>  (identifies the user to promote)
//        X-Bootstrap-Secret: <ADMIN_BOOTSTRAP_SECRET>     (proves the operator authorized it)
//      The bootstrap secret lives in a dedicated header because the
//      Authorization slot is already owned by requireAuthMiddleware
//      for the Privy token — sharing it made the endpoint unreachable.
//      Rotate ADMIN_BOOTSTRAP_SECRET per environment, ideally on use.
//   2. One-shot: refuses if any User.platformPermission='ADMIN'
//      already exists. After that the proper escalation path is
//      another admin promoting via the admin app (or a manual
//      Prisma update for emergencies).
//
// Caller must already be signed in via Privy — promoting an
// anonymous request makes no sense (the row to update is the
// caller's). Identity from req.authId.

import { PlatformUserType } from '@prisma/client';
import HttpStatus from 'http-status-codes';

import prisma from '@src/api2/prisma';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .post(async (req, res) => {
    const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!secret) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).end('ADMIN_BOOTSTRAP_SECRET not configured');
      return;
    }
    // Header name is case-insensitive on the wire but Node normalizes
    // to lowercase when populating req.headers.
    const raw = req.headers['x-bootstrap-secret'];
    const provided = Array.isArray(raw) ? raw[0] : raw;
    if (!provided || provided !== secret) {
      res.status(HttpStatus.UNAUTHORIZED).end('Unauthorized');
      return;
    }

    const me = await getUserByAuthId(req.authId, false);
    if (!me) {
      res.status(HttpStatus.NOT_FOUND).end('User not found');
      return;
    }

    // Refuse if any admin already exists. The bootstrap path is
    // strictly for the first admin — subsequent promotions go
    // through the admin UI or manual SQL.
    const existingAdminCount = await prisma.user.count({
      where: { platformPermission: PlatformUserType.ADMIN },
    });
    if (existingAdminCount > 0) {
      res.status(HttpStatus.CONFLICT).end('An admin already exists; bootstrap is one-shot');
      return;
    }

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: { platformPermission: PlatformUserType.ADMIN },
      select: { id: true, username: true, platformPermission: true },
    });

    // Audit log so the promotion is visible in the admin trail.
    try {
      await prisma.auditLog.create({
        data: {
          action: 'user.role.set',
          actor: { connect: { id: me.id } },
          target: { connect: { id: me.id } },
          payload: {
            from: me.platformPermission,
            to: PlatformUserType.ADMIN,
            via: 'bootstrap',
          },
        },
      });
    } catch (err) {
      // Audit failure shouldn't block the promotion itself, but log
      // it so an operator can investigate.
      // eslint-disable-next-line no-console
      console.warn('audit log write failed during admin bootstrap', err);
    }

    res.json({
      id: updated.id.toString(),
      username: updated.username,
      platformPermission: updated.platformPermission,
    });
  });

export default handler;
