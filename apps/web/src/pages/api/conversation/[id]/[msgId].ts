// PATCH  /conversation/:id/:msgId   Edit a DM
// DELETE /conversation/:id/:msgId   Delete a DM
//
// Both operations are author-only — verify the caller authored the
// DirectMessage before mutating. Returns the affected row as JSON so
// the client can update its local store in place.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from 'lib/nextconnect';
import { Rest } from 'types/utilityTypes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

async function assertAuthor(
  authId: string,
  msgId: bigint,
): Promise<true | { status: number; body: string }> {
  const user = await prisma.user.findUnique({
    where: { authId },
    select: { id: true },
  });
  if (!user) return { status: 404, body: 'user not found' };
  const existing = await prisma.directMessage.findUnique({
    where: { id: msgId },
    select: { authorId: true },
  });
  if (!existing) return { status: 404, body: 'message not found' };
  if (existing.authorId !== user.id) return { status: 403, body: 'forbidden' };
  return true;
}

handler.patch(async (req: Rest<{ id: string; msgId: string }>, res) => {
  const { query: { msgId } } = req;
  const { text } = (req.body ?? {}) as { text?: string };
  if (typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).end('text is required');
  }
  const id = BigInt(msgId);
  const ok = await assertAuthor(req.authId, id);
  if (ok !== true) return res.status(ok.status).end(ok.body);

  const updated = await prisma.directMessage.update({
    where: { id },
    data: { text },
  });
  return res.json(updated);
});

handler.delete(async (req: Rest<{ id: string; msgId: string }>, res) => {
  const { query: { msgId } } = req;
  const id = BigInt(msgId);
  const ok = await assertAuthor(req.authId, id);
  if (ok !== true) return res.status(ok.status).end(ok.body);

  const deleted = await prisma.directMessage.delete({ where: { id } });
  return res.json(deleted);
});

export default handler;
