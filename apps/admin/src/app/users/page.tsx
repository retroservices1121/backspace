import { prisma } from '@backspace/db';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireAdmin();

  const q = searchParams.q?.trim();
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    take: 50,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      name: true,
      verified: true,
      platformPermission: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Users</h1>

      <form className="mb-6">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search username or name…"
          className="w-80 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
        />
      </form>

      <table className="w-full border-collapse text-sm">
        <thead className="text-left text-white/50">
          <tr>
            <th className="border-b border-white/10 py-2">User</th>
            <th className="border-b border-white/10 py-2">Verified</th>
            <th className="border-b border-white/10 py-2">Role</th>
            <th className="border-b border-white/10 py-2">Joined</th>
            <th className="border-b border-white/10 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id.toString()} className="hover:bg-white/5">
              <td className="border-b border-white/5 py-2">
                <div className="font-medium">@{u.username}</div>
                <div className="text-white/50">{u.name}</div>
              </td>
              <td className="border-b border-white/5 py-2">
                {u.verified ? (
                  <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                    ✓ verified
                  </span>
                ) : (
                  <span className="text-white/40">—</span>
                )}
              </td>
              <td className="border-b border-white/5 py-2 font-mono text-xs">
                {u.platformPermission}
              </td>
              <td className="border-b border-white/5 py-2 text-white/50">
                {u.createdAt.toISOString().slice(0, 10)}
              </td>
              <td className="border-b border-white/5 py-2 text-right">
                <Link
                  href={`/users/${u.id}`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Manage →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
