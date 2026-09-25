import type { NextApiRequest, NextApiResponse } from 'next';
import { Permissions } from '@prisma/client';

import prisma from '@src/api2/prisma';
import { ensureGatePostReference } from '@src/lib/markets/gatePostReference';
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
  const stop = new Set(['will', 'what', 'when', 'where', 'with', 'from', 'this', 'that', 'have', 'market', 'price', 'before', 'after']);
  const terms = (value: string) => (value.toLowerCase().match(/[a-z0-9]+/g) || []).filter((word) => word.length >= 4 && !stop.has(word));
  const topical = /\b(prediction|odds|election|president|bitcoin|ethereum|crypto|sports|nba|nfl|market|rate|inflation|fed)\b/i;

  const matches = posts.flatMap((post: any) => {
    const text = plainText(post.text);
    const lower = text.toLowerCase();
    const attached = post.gateMarketId
      ? catalog.markets.find((market) => market.externalId === post.gateMarketId)
      : null;
    const ranked = catalog.markets
      .map((market) => ({ market, score: terms(`${market.question} ${market.category || ''}`).filter((term) => lower.includes(term)).length }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
    const market = attached || ranked[0]?.market || null;
    if (!market && !topical.test(text)) return [];
    return {
      uuid: post.uuid,
      text: plainText(post.text).slice(0, 220),
      createdAt: post.createdAt,
      author: post.author,
      engagement: post._count,
      marketId: market?.externalId || null,
      market: market ? {
        question: market.question,
        imageUrl: market.imageUrl,
        status: market.status,
      } : null,
    };
  }).slice(0, 12);

  return res.json(matches);
}
