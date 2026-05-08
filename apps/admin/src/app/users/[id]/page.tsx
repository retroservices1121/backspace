import { prisma, PlatformUserType } from '@backspace/db';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { VerifyToggle } from './VerifyToggle';
import { RoleSelect } from './RoleSelect';

export const dynamic = 'force-dynamic';

export default async function UserDetail({ params }: { params: { id: string } }) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: BigInt(params.id) },
    include: {
      wallets: true,
      accuracy: true,
      auditMentions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { actor: { select: { username: true } } },
      },
    },
  });
  if (!user) return notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold">@{user.username}</h1>
      <div className="mb-6 text-white/60">{user.name}</div>

      <section className="mb-8 rounded border border-white/10 p-4">
        <div className="mb-4 text-xs uppercase tracking-widest text-white/50">Status</div>
        <div className="flex items-center gap-6">
          <VerifyToggle userId={user.id.toString()} verified={user.verified} />
          <RoleSelect userId={user.id.toString()} role={user.platformPermission} />
        </div>
      </section>

      <section className="mb-8 rounded border border-white/10 p-4">
        <div className="mb-3 text-xs uppercase tracking-widest text-white/50">Wallets</div>
        {user.wallets.length === 0 ? (
          <div className="text-white/40">No wallets linked.</div>
        ) : (
          <ul className="space-y-1 text-sm">
            {user.wallets.map((w) => (
              <li key={w.id.toString()} className="font-mono">
                <span className="text-white/50">{w.chain}</span>:{' '}
                <span>{w.address}</span>
                {w.verifiedAt && <span className="ml-2 text-green-400">verified</span>}
                {w.isPrimary && <span className="ml-2 text-blue-400">primary</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded border border-white/10 p-4">
        <div className="mb-3 text-xs uppercase tracking-widest text-white/50">Audit history</div>
        {user.auditMentions.length === 0 ? (
          <div className="text-white/40">No prior admin actions.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {user.auditMentions.map((a) => (
              <li key={a.id.toString()} className="border-l-2 border-white/10 pl-3">
                <div className="font-mono text-xs text-white/50">{a.action}</div>
                <div className="text-white/70">
                  by @{a.actor.username} · {a.createdAt.toISOString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
