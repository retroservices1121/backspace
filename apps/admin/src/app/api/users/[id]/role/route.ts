import { NextRequest, NextResponse } from 'next/server';
import { prisma, PlatformUserType } from '@backspace/db';
import { requireAdmin } from '@/lib/auth';

const VALID = new Set<string>(Object.values(PlatformUserType));

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    const code = (e as Error).message === 'FORBIDDEN' ? 403 : 401;
    return NextResponse.json({ error: (e as Error).message }, { status: code });
  }

  // Only ADMIN can change roles — MODERATOR / ELEVATED can verify but not promote
  if (admin.platformPermission !== PlatformUserType.ADMIN) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = (await req.json()) as { role: string };
  if (!VALID.has(body.role)) {
    return NextResponse.json({ error: 'INVALID_ROLE' }, { status: 400 });
  }

  const targetId = BigInt(params.id);
  const before = await prisma.user.findUnique({
    where: { id: targetId },
    select: { platformPermission: true, username: true },
  });
  if (!before) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetId },
      data: { platformPermission: body.role as PlatformUserType },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'user.role.set',
        targetId,
        payload: { from: before.platformPermission, to: body.role, username: before.username },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, role: body.role });
}
