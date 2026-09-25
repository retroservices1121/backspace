import type { NextApiRequest, NextApiResponse } from 'next';
import { Permissions } from '@prisma/client';

import prisma from '@src/api2/prisma';
import { ensureGatePostReference } from '@src/lib/markets/gatePostReference';
import { matchConversationToMarket } from '@src/lib/markets/matchConversation';
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
  await ensureGatePostReference();

  const posts = await (prisma.post as any).findMany({
    where: {
      OR: [
        { profileId: { not: null } },
        { message: { channel: { readPermission: Permissions.EVERYONE } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
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
  const catalog = await adapter.listMarkets({ limit: 100 });
  const liveMarkets = catalog.markets.filter(
    (market) => market.status === 'ACTIVE' && market.acceptingOrders !== false,
  );

  const matches = posts.flatMap((post: any) => {
    const text = plainText(post.text);
    const attached = post.gateMarketId
      ? liveMarkets.find((market) => market.externalId === post.gateMarketId)
      : null;
    const market = attached || matchConversationToMarket(text, liveMarkets);
    if (!market) return [];
    return {
      uuid: post.uuid,
      text: plainText(post.text).slice(0, 220),
      createdAt: post.createdAt,
      author: post.author,
      engagement: post._count,
      marketId: market.externalId,
      market: {
        question: market.question,
        imageUrl: market.imageUrl,
        status: market.status,
      },
    };
  }).slice(0, 12);

  return res.json(matches);
}
