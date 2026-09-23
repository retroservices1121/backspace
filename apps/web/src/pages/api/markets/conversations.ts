import type { NextApiRequest, NextApiResponse } from 'next';
import { Permissions } from '@prisma/client';

import prisma from '@src/api2/prisma';
import { GatePredictionAdapter } from '@backspace/markets';

function plainText(value: string): string {
  try {
    const nodes = JSON.parse(value);
    const walk = (node: any): string => {
      if (typeof node === 'string') return node;
      if (typeof node?.text === 'string') return node.text;
      if (Array.isArray(node)) return node.map(walk).join(' ');
      if (Array.isArray(node?.children)) return node.children.map(walk).join(' ');
      return '';
    };
    return walk(nodes).replace(/\s+/g, ' ').trim();
  } catch {
    return value.replace(/\s+/g, ' ').trim();
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');

  const posts = await (prisma.post as any).findMany({
    where: {
      gateMarketId: { not: null },
      OR: [
        { profileId: { not: null } },
        { message: { channel: { readPermission: Permissions.EVERYONE } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: {
      uuid: true,
      text: true,
      createdAt: true,
      gateMarketId: true,
      author: { select: { username: true, name: true, verified: true } },
      _count: { select: { likes: true, comments: true, reposts: true } },
    },
  });

  const adapter = new GatePredictionAdapter();
  const ids = Array.from(new Set(posts.map((post: any) => post.gateMarketId))) as string[];
  const markets = await Promise.all(ids.map(async (id) => {
    try {
      return [id, await adapter.getMarket({ venue: 'GATE', externalId: id })] as const;
    } catch {
      return [id, null] as const;
    }
  }));
  const byId = new Map(markets);

  return res.json(posts.map((post: any) => {
    const market = byId.get(post.gateMarketId);
    return {
      uuid: post.uuid,
      text: plainText(post.text).slice(0, 220),
      createdAt: post.createdAt,
      author: post.author,
      engagement: post._count,
      marketId: post.gateMarketId,
      market: market ? {
        question: market.question,
        imageUrl: market.imageUrl,
        status: market.status,
      } : null,
    };
  }));
}
