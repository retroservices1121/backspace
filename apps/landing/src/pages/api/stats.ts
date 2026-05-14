// Public stats for the landing meta-line — just the total signup count.
// Cached briefly at the edge so a viral spike doesn't hammer Postgres
// with one count query per page view.
import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@src/lib/prisma';

export type StatsResponse = {
  total: number;
  recentHandles: string[];
};

// Cap on how many handles the marquee gets. Big enough to feel
// active, small enough to keep the payload tiny and the marquee
// loop short.
const RECENT_HANDLE_LIMIT = 60;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse | { error: string }>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [total, recent] = await Promise.all([
      prisma.waitlistEntry.count(),
      prisma.waitlistEntry.findMany({
        where: { usernameLower: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: RECENT_HANDLE_LIMIT,
        select: { usernameDisplay: true, usernameLower: true },
      }),
    ]);
    const recentHandles = recent
      .map((r) => r.usernameDisplay ?? r.usernameLower)
      .filter((h): h is string => Boolean(h));
    // 30s edge cache, allow stale-while-revalidate up to 5 min.
    res.setHeader(
      'Cache-Control',
      'public, max-age=0, s-maxage=30, stale-while-revalidate=300',
    );
    return res.status(200).json({ total, recentHandles });
  } catch (err) {
    console.error('[stats] count failed', err);
    return res.status(500).json({ error: 'Could not load stats.' });
  }
}
