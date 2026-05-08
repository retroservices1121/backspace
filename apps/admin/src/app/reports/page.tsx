import { prisma, ReportStatus } from '@backspace/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  await requireAdmin();
  const reports = await prisma.report.findMany({
    where: { status: { in: [ReportStatus.OPEN, ReportStatus.REVIEWING] } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { reporter: { select: { username: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Reports queue</h1>
      {reports.length === 0 ? (
        <p className="text-white/50">No open reports.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id.toString()} className="rounded border border-white/10 p-4">
              <div className="mb-1 flex items-center gap-3 text-xs text-white/50">
                <span className="font-mono">{r.targetType}</span>
                <span>·</span>
                <span>by @{r.reporter.username}</span>
                <span>·</span>
                <span>{r.createdAt.toISOString()}</span>
              </div>
              <div className="font-medium">{r.reason}</div>
              {r.details && <div className="mt-1 text-sm text-white/70">{r.details}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
