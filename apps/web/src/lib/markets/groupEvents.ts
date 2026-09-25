export type EventMarketRef = {
  id: string;
  eventId?: string | null;
  eventTitle?: string | null;
  question: string;
};

export type MarketEventGroup<T extends EventMarketRef> = {
  key: string;
  eventId: string | null;
  title: string;
  markets: T[];
};

/** Preserve the server's market ordering while folding related contracts into
 * their Gate event. Markets without an event id remain independent cards. */
export function groupMarketsByEvent<T extends EventMarketRef>(
  markets: T[],
): MarketEventGroup<T>[] {
  const groups = new Map<string, MarketEventGroup<T>>();

  for (const market of markets) {
    const eventId = market.eventId || null;
    const key = eventId ? `event:${eventId}` : `market:${market.id}`;
    const existing = groups.get(key);
    if (existing) {
      existing.markets.push(market);
      if (!existing.title && market.eventTitle) existing.title = market.eventTitle;
      continue;
    }

    groups.set(key, {
      key,
      eventId,
      title: market.eventTitle || market.question,
      markets: [market],
    });
  }

  return Array.from(groups.values());
}
