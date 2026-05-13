// Single-process token bucket keyed by IP. Good enough for a marketing
// landing — when this app grows past one Railway replica we'll need
// shared state (Upstash, etc.) but for v1 a fixed-size LRU is fine.

type Bucket = { tokens: number; lastRefillMs: number };

const BUCKETS = new Map<string, Bucket>();
const MAX_KEYS = 10_000; // hard cap so a malicious flood can't blow heap

function evictIfFull() {
  if (BUCKETS.size <= MAX_KEYS) return;
  // Drop the oldest insertion; Map iteration order is insertion order.
  const first = BUCKETS.keys().next().value;
  if (first !== undefined) BUCKETS.delete(first);
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterMs: number };

// `capacity` tokens refill at `refillIntervalMs` per token. A request
// costs one token. Returns whether the caller should be allowed through.
export function checkRateLimit(
  key: string,
  capacity: number,
  refillIntervalMs: number,
): RateLimitResult {
  const now = Date.now();
  let bucket = BUCKETS.get(key);
  if (!bucket) {
    evictIfFull();
    bucket = { tokens: capacity, lastRefillMs: now };
    BUCKETS.set(key, bucket);
  }
  const elapsed = now - bucket.lastRefillMs;
  const refilled = Math.floor(elapsed / refillIntervalMs);
  if (refilled > 0) {
    bucket.tokens = Math.min(capacity, bucket.tokens + refilled);
    bucket.lastRefillMs += refilled * refillIntervalMs;
  }
  if (bucket.tokens <= 0) {
    const retryAfterMs = refillIntervalMs - (now - bucket.lastRefillMs);
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
  }
  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens };
}

// Best-effort IP extraction. Railway / Cloudflare front-ends populate
// x-forwarded-for; fall back to the socket remote address.
export function clientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string | null };
}): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  if (Array.isArray(xff) && xff[0]) return xff[0];
  return req.socket?.remoteAddress ?? 'unknown';
}
