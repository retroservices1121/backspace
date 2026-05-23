// /api/users/me/tour-completed
//
// GET  — return the caller's current hasCompletedTour flag.
// POST — set it. Body: { completed: boolean }.
//
// Mirrors public-accuracy.ts. The home-feed Tour component fires POST
// on finish/skip; the /settings/account "Replay welcome tour" link
// fires POST with completed:false to opt the user back in.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.get(async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { hasCompletedTour: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end();
  return res.json({ completed: me.hasCompletedTour });
});

handler.post(async (req, res) => {
  const completed = !!(req.body as { completed?: boolean })?.completed;
  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end();

  await prisma.user.update({
    where: { id: me.id },
    data: { hasCompletedTour: completed },
  });
  return res.json({ completed });
});

export default handler;
