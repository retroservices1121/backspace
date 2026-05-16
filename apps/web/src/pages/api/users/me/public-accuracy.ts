// /api/users/me/public-accuracy
//
// GET  — return the caller's current publicAccuracy flag.
// POST — set it. Body: { enabled: boolean }.
//
// Tiny standalone endpoint so the wallet settings page can toggle
// the flag without touching the rest of the (large) user-update
// surface. Keeps the privacy decision easy to audit.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.get(async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { publicAccuracy: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end();
  return res.json({ enabled: me.publicAccuracy });
});

handler.post(async (req, res) => {
  const enabled = !!(req.body as { enabled?: boolean })?.enabled;
  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end();

  await prisma.user.update({
    where: { id: me.id },
    data: { publicAccuracy: enabled },
  });
  return res.json({ enabled });
});

export default handler;
