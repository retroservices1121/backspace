import { prisma } from '@backspace/db';
import { headers } from 'next/headers';

type AuditOpts = {
  actorId: bigint;
  action: string;
  targetUserId?: bigint;
  targetCommunityId?: bigint;
  targetMarketId?: bigint;
  targetPostId?: bigint;
  targetCommentId?: bigint;
  payload?: Record<string, unknown>;
};

export async function writeAudit(opts: AuditOpts) {
  const h = headers();
  await prisma.auditLog.create({
    data: {
      actorId: opts.actorId,
      action: opts.action,
      targetId: opts.targetUserId,
      targetCommunityId: opts.targetCommunityId,
      targetMarketId: opts.targetMarketId,
      targetPostId: opts.targetPostId,
      targetCommentId: opts.targetCommentId,
      payload: (opts.payload as object) ?? undefined,
      ipAddress: h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? null,
      userAgent: h.get('user-agent') ?? null,
    },
  });
}
