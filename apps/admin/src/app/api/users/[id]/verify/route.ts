import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@backspace/db';
import { requireAdmin } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    const code = (e as Error).message === 'FORBIDDEN' ? 403 : 401;
    return NextResponse.json({ error: (e as Error).message }, { status: code });
  }

  const { verified } = (await req.json()) as { verified: boolean };
  const targetId = BigInt(params.id);

  const before = await prisma.user.findUnique({
    where: { id: targetId },
    select: { verified: true, username: true },
  });
  if (!before) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetId },
      data: { verified },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'user.verify',
        targetId,
        payload: { from: before.verified, to: verified, username: before.username },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, verified });
}
