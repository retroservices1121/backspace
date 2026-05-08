import { prisma } from '@backspace/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  await requireAdmin();
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      actor: { select: { username: true } },
      target: { select: { username: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Audit log</h1>
      <ul className="space-y-1 font-mono text-xs">
        {entries.map((e) => (
          <li
            key={e.id.toString()}
            className="grid grid-cols-[180px_140px_120px_1fr] gap-3 border-b border-white/5 py-1.5"
          >
            <span className="text-white/40">{e.createdAt.toISOString()}</span>
            <span className="text-blue-300">{e.action}</span>
            <span className="text-white/70">@{e.actor.username}</span>
            <span className="text-white/60">
              {e.target && `→ @${e.target.username} `}
              {e.payload ? JSON.stringify(e.payload) : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
