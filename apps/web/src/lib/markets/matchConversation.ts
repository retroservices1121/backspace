type MatchableMarket = {
  externalId: string;
  question: string;
  category: string | null;
  eventTitle?: string | null;
};

const STOP_WORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'below', 'before', 'being',
  'between', 'contract', 'could', 'does', 'doing', 'down', 'event', 'from',
  'have', 'having', 'here', 'into', 'less', 'lose', 'loses', 'market', 'markets',
  'more', 'most', 'over', 'price', 'reach', 'should', 'some', 'than', 'that',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'today',
  'tomorrow', 'under', 'until', 'what', 'when', 'where', 'which', 'while',
  'with', 'would', 'will', 'wins', 'winner', 'winning', 'yes', 'your',
  'the', 'and', 'for', 'but', 'not', 'you', 'are', 'was', 'were', 'has', 'had',
  'its', 'who', 'why', 'how', 'can', 'did', 'get', 'got', 'out', 'all', 'any',
  'our', 'off', 'per', 'via', 'win', 'won', 'up', 'no', 'or', 'of', 'to', 'in',
  'on', 'at', 'by', 'as', 'it', 'is', 'be', 'a', 'an',
]);

const ALIASES: Record<string, string> = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  gop: 'republican',
  dems: 'democratic',
  democrat: 'democratic',
  republicans: 'republican',
  democrats: 'democratic',
  champs: 'championship',
};

export function matchConversationToMarket<T extends MatchableMarket>(
  text: string,
  markets: T[],
): T | null {
  const postTerms = new Set(terms(text));
  if (postTerms.size < 2 || markets.length === 0) return null;

  const indexed = markets.map((market) => ({
    market,
    terms: new Set(terms(`${market.question} ${market.eventTitle || ''} ${market.category || ''}`)),
  }));
  const frequency = new Map<string, number>();
  for (const item of indexed) {
    for (const term of item.terms) frequency.set(term, (frequency.get(term) || 0) + 1);
  }

  const ranked = indexed.flatMap((item) => {
    const shared = Array.from(postTerms).filter((term) => item.terms.has(term));
    // A single shared word is too weak: it caused ordinary words such as
    // "jets" and "down" to attach unrelated contracts.
    if (shared.length < 2) return [];
    const rarity = shared.reduce((score, term) => {
      const appearances = frequency.get(term) || markets.length;
      return score + 1 + Math.log2((markets.length + 1) / (appearances + 1));
    }, 0);
    const postCoverage = shared.length / postTerms.size;
    const marketCoverage = shared.length / Math.max(1, item.terms.size);
    return [{ market: item.market, score: rarity + postCoverage + marketCoverage, shared }];
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best) return null;
  const runnerUp = ranked[1];
  // If two contracts explain the post almost equally well, do not guess.
  if (runnerUp && best.score - runnerUp.score < 1) return null;
  return best.market;
}

function terms(value: string): string[] {
  return (value.toLowerCase().match(/[a-z0-9]+/g) || [])
    .map((term) => ALIASES[term] || term)
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));
}
