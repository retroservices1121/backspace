import { prisma } from '@backspace/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function CommunitiesPage() {
  await requireAdmin();
  const communities = await prisma.community.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { owner: { select: { username: true } }, _count: { select: { members: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Communities</h1>
      <table className="w-full text-sm">
        <thead className="text-left text-white/50">
          <tr>
            <th className="border-b border-white/10 py-2">Name</th>
            <th className="border-b border-white/10 py-2">Owner</th>
            <th className="border-b border-white/10 py-2">Members</th>
            <th className="border-b border-white/10 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {communities.map((c) => (
            <tr key={c.id.toString()} className="hover:bg-white/5">
              <td className="border-b border-white/5 py-2">{c.name}</td>
              <td className="border-b border-white/5 py-2 text-white/60">@{c.owner.username}</td>
              <td className="border-b border-white/5 py-2">{c._count.members}</td>
              <td className="border-b border-white/5 py-2">
                {c.archivedAt ? (
                  <span className="text-red-400">archived</span>
                ) : (
                  <span className="text-green-400">active</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
