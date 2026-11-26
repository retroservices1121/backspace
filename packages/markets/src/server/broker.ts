// Server-only Gate DexBuilder Broker client.
//
// SECURITY: this module reads GATE_BROKER_API_KEY / GATE_BROKER_API_SECRET
// and produces SIGN values. It must only ever run on the Backspace server.
// Never log the key, the secret, SIGN, Timestamp, Authorization headers, or
// request bodies from here or from callers.
//
// This file is intentionally self-contained (its only import is Node
// `crypto`) so the signing unit tests can load it directly with node:test.
// Keep it TypeScript 4.6 compatible: apps/web compiles it with 4.6.

import { createHash, createHmac } from 'crypto';

export const DEFAULT_DEXBUILDER_API_URL = 'https://api.dexbuilder.com';

/** Private path prefixes per Broker product. All include /api/v4. */
export const BROKER_PATH_PREFIX = {
  platform: '/api/v4/dexbuilder',
  prediction: '/api/v4/broker/prediction',
  event_contracts: '/api/v4/broker/event_contracts',
};

export type BrokerProduct = 'platform' | 'prediction' | 'event_contracts';
export type BrokerMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type BrokerQueryValue = string | number | boolean;
/** Ordered query parameters. Order is preserved exactly as sent and signed. */
export type BrokerQuery = Array<[string, BrokerQueryValue]>;

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

/** Hex SHA-512 of the exact request body bytes ('' when there is no body). */
export function sha512Hex(body: string): string {
  return createHash('sha512').update(body, 'utf8').digest('hex');
}

export type SignatureInput = {
  method: string;
  /** External path including /api/v4, no host, no query. */
  path: string;
  /** Unencoded query string in the order sent, or ''. */
  queryString: string;
  /** Exact body bytes that will be sent, or '' for no body. */
  body: string;
  /** Unix seconds; must equal the Timestamp header. */
  timestamp: string | number;
};

/**
 * Five lines joined by "\n":
 *   HTTP_METHOD, REQUEST_PATH, QUERY_STRING, HexEncode(SHA512(BODY)), TIMESTAMP
 * X-User-Wallet-Address is deliberately not part of this string.
 */
export function buildSignatureString(input: SignatureInput): string {
  return [
    input.method.toUpperCase(),
    input.path,
    input.queryString,
    sha512Hex(input.body),
    String(input.timestamp),
  ].join('\n');
}

/** SIGN = HexEncode(HMAC_SHA512(secret, signature string)). */
export function signBrokerRequest(secret: string, input: SignatureInput): string {
  return createHmac('sha512', secret).update(buildSignatureString(input), 'utf8').digest('hex');
}

/** Unencoded `k=v&k2=v2`, in order. Used for the signature string only. */
export function signingQueryString(query: BrokerQuery | undefined): string {
  if (!query || query.length === 0) return '';
  return query.map(([key, value]) => `${key}=${String(value)}`).join('&');
}

/** URL-encoded query in the same order as the signing string. */
export function encodedQueryString(query: BrokerQuery | undefined): string {
  if (!query || query.length === 0) return '';
  return query
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Broker credentials are missing. API routes map this to HTTP 503. */
export class BrokerNotConfiguredError extends Error {
  readonly code = 'GATE_BROKER_NOT_CONFIGURED';
  readonly status = 503;

  constructor() {
    // Generic on purpose: do not reveal which variable is missing.
    super('Gate Broker access is not configured on this server.');
    this.name = 'BrokerNotConfiguredError';
    // Keep instanceof working when compiled to an ES5 target.
    Object.setPrototypeOf(this, BrokerNotConfiguredError.prototype);
  }
}

export function isBrokerNotConfiguredError(error: unknown): error is BrokerNotConfiguredError {
  return error instanceof BrokerNotConfiguredError
    || Boolean(error && typeof error === 'object' && (error as { code?: unknown }).code === 'GATE_BROKER_NOT_CONFIGURED');
}

/** Gate rejected or failed a Broker request. Never contains secrets or bodies. */
export class GateBrokerError extends Error {
  readonly status: number;
  readonly label: string | null;
  readonly gateCode: number | null;

  constructor(status: number, label: string | null, message: string, gateCode: number | null = null) {
    super(message);
    this.name = 'GateBrokerError';
    this.status = status;
    this.label = label;
    this.gateCode = gateCode;
    Object.setPrototypeOf(this, GateBrokerError.prototype);
  }
}

export function isGateBrokerError(error: unknown): error is GateBrokerError {
  return error instanceof GateBrokerError
    || Boolean(error && typeof error === 'object' && (error as { name?: unknown }).name === 'GateBrokerError');
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export type BrokerConfig = {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
};

type Env = Record<string, string | undefined>;

function processEnv(): Env {
  return typeof process !== 'undefined' && process.env ? (process.env as Env) : {};
}

/** True when both Broker variables are present. Never exposes values. */
export function isBrokerConfigured(env: Env = processEnv()): boolean {
  return Boolean((env.GATE_BROKER_API_KEY || '').trim() && (env.GATE_BROKER_API_SECRET || '').trim());
}

/**
 * Read GATE_BROKER_API_KEY, GATE_BROKER_API_SECRET and the optional
 * GATE_DEXBUILDER_API_URL. Throws BrokerNotConfiguredError when either
 * credential is missing or blank.
 */
export function readBrokerConfig(env: Env = processEnv()): BrokerConfig {
  const apiKey = (env.GATE_BROKER_API_KEY || '').trim();
  const apiSecret = (env.GATE_BROKER_API_SECRET || '').trim();
  if (!apiKey || !apiSecret) throw new BrokerNotConfiguredError();
  const baseUrl = ((env.GATE_DEXBUILDER_API_URL || '').trim() || DEFAULT_DEXBUILDER_API_URL).replace(/\/+$/, '');
  return { apiKey, apiSecret, baseUrl };
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export type BrokerRequestOptions = {
  method?: BrokerMethod;
  /** Ordered query params. Signed unencoded, sent encoded, same order. */
  query?: BrokerQuery;
  /**
   * Request body. Objects are serialized once with JSON.stringify and those
   * exact bytes are both hashed and sent. Strings are sent verbatim.
   */
  body?: unknown;
  /** Registered user wallet. Sent as X-User-Wallet-Address; not signed. */
  walletAddress?: string;
  /** Required by some Platform routes, e.g. users/register. */
  idempotencyKey?: string;
};

export type PreparedBrokerRequest = {
  url: string;
  method: BrokerMethod;
  headers: Record<string, string>;
  body: string | undefined;
};

type FetchLike = (url: string, init: {
  method: string;
  headers: Record<string, string>;
  body?: string;
}) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export type GateBrokerClientOptions = {
  config?: BrokerConfig;
  /** Correct clock skew with GET /api/v4/prediction/time before first use. */
  syncClock?: boolean;
  fetch?: FetchLike;
  /** Unix-seconds clock, injectable for tests. */
  now?: () => number;
};

const CLOCK_SYNC_TTL_SECONDS = 600;

/**
 * Signs and sends private Gate DexBuilder requests with the Broker API key.
 *
 * Construct per request or share one instance; it holds no user state.
 * The secret is captured in a closure (not an enumerable property), so
 * logging the client object cannot print it.
 */
export class GateBrokerClient {
  readonly baseUrl: string;

  private readonly sign: (input: SignatureInput) => string;
  private readonly keyHeader: () => string;
  private readonly fetchImpl: FetchLike;
  private readonly now: () => number;
  private readonly shouldSyncClock: boolean;
  private clockOffsetSeconds = 0;
  private clockSyncedAt = 0;

  constructor(options: GateBrokerClientOptions = {}) {
    const config = options.config || readBrokerConfig();
    if (!config.apiKey || !config.apiSecret) throw new BrokerNotConfiguredError();
    const secret = config.apiSecret;
    const key = config.apiKey;
    this.sign = (input) => signBrokerRequest(secret, input);
    this.keyHeader = () => key;
    this.baseUrl = (config.baseUrl || DEFAULT_DEXBUILDER_API_URL).replace(/\/+$/, '');
    this.fetchImpl = options.fetch || (globalThis.fetch as unknown as FetchLike);
    this.now = options.now || (() => Math.floor(Date.now() / 1000));
    this.shouldSyncClock = options.syncClock === true;
  }

  /** Current Timestamp header value (Unix seconds, skew-corrected). */
  timestamp(): string {
    return String(Math.floor(this.now() + this.clockOffsetSeconds));
  }

  /**
   * Fetch Gate server time and store the offset. Public route, unsigned.
   * Accepts seconds or milliseconds; Timestamp stays in seconds.
   */
  async syncClock(): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/api/v4/prediction/time`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new GateBrokerError(res.status, null, 'Gate server time unavailable.');
    const body = safeJson(await res.text()) as { server_time?: number } | null;
    const raw = body && typeof body.server_time === 'number' ? body.server_time : NaN;
    if (!Number.isFinite(raw)) throw new GateBrokerError(502, null, 'Gate server time unreadable.');
    const serverSeconds = raw > 10000000000 ? raw / 1000 : raw;
    this.clockOffsetSeconds = Math.round(serverSeconds - this.now());
    this.clockSyncedAt = this.now();
  }

  /** Build URL, headers, and exact body bytes without sending. */
  prepare(path: string, options: BrokerRequestOptions = {}): PreparedBrokerRequest {
    if (!path.startsWith('/api/v4/') || path.includes('?')) {
      throw new Error('Broker path must be an external /api/v4 path without a query string.');
    }
    const method = options.method || 'GET';
    const body = serializeBody(options.body);
    const timestamp = this.timestamp();
    const sign = this.sign({
      method,
      path,
      queryString: signingQueryString(options.query),
      body: body === undefined ? '' : body,
      timestamp,
    });
    const headers: Record<string, string> = {
      Accept: 'application/json',
      KEY: this.keyHeader(),
      Timestamp: timestamp,
      SIGN: sign,
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.walletAddress) headers['X-User-Wallet-Address'] = options.walletAddress;
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    const qs = encodedQueryString(options.query);
    return { url: `${this.baseUrl}${path}${qs ? `?${qs}` : ''}`, method, headers, body };
  }

  /** Signed request. Returns the parsed JSON body (Platform: unwrapped `data`). */
  async request<T>(path: string, options: BrokerRequestOptions = {}): Promise<T> {
    if (this.shouldSyncClock && (this.clockSyncedAt === 0 || this.now() - this.clockSyncedAt > CLOCK_SYNC_TTL_SECONDS)) {
      // Skew correction is best effort; a failure leaves the local clock.
      await this.syncClock().catch(() => { this.clockSyncedAt = this.now(); });
    }
    const prepared = this.prepare(path, options);
    const res = await this.fetchImpl(prepared.url, {
      method: prepared.method,
      headers: prepared.headers,
      body: prepared.body,
    });
    const parsed = safeJson(await res.text().catch(() => ''));
    const platform = path.startsWith(BROKER_PATH_PREFIX.platform + '/');
    return interpretResponse<T>(res.status, res.ok, parsed, platform);
  }

  /** Platform API: `/api/v4/dexbuilder/<path>`. */
  platform<T>(subpath: string, options?: BrokerRequestOptions): Promise<T> {
    return this.request<T>(joinPath(BROKER_PATH_PREFIX.platform, subpath), options);
  }

  /** Private Prediction Markets: `/api/v4/broker/prediction/<path>`. */
  prediction<T>(subpath: string, options?: BrokerRequestOptions): Promise<T> {
    return this.request<T>(joinPath(BROKER_PATH_PREFIX.prediction, subpath), options);
  }

  /** Private Event Contracts: `/api/v4/broker/event_contracts/<path>`. */
  eventContracts<T>(subpath: string, options?: BrokerRequestOptions): Promise<T> {
    return this.request<T>(joinPath(BROKER_PATH_PREFIX.event_contracts, subpath), options);
  }

  /** Private product route by name. */
  product<T>(product: BrokerProduct, subpath: string, options?: BrokerRequestOptions): Promise<T> {
    return this.request<T>(joinPath(BROKER_PATH_PREFIX[product], subpath), options);
  }
}

function joinPath(prefix: string, subpath: string): string {
  return `${prefix}/${subpath.replace(/^\/+/, '')}`;
}

function serializeBody(body: unknown): string | undefined {
  if (body === undefined || body === null) return undefined;
  if (typeof body === 'string') return body;
  return JSON.stringify(body);
}

function safeJson(text: string): unknown {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

type GateErrorBody = { label?: unknown; message?: unknown; code?: unknown; data?: unknown };

function interpretResponse<T>(status: number, ok: boolean, parsed: unknown, platform: boolean): T {
  const body = (parsed && typeof parsed === 'object' ? parsed : {}) as GateErrorBody;
  const label = typeof body.label === 'string' ? body.label : null;
  const message = typeof body.message === 'string' && body.message ? body.message : 'Gate request failed.';
  if (!ok) {
    const code = typeof body.code === 'number' ? body.code : null;
    throw new GateBrokerError(status, label, message, code);
  }
  if (platform && typeof body.code === 'number') {
    // Platform envelopes: { code, message, data, trace_id }. Some business
    // errors are HTTP 200 with a non-zero code.
    if (body.code !== 0) throw new GateBrokerError(status === 200 ? 422 : status, label, message, body.code);
    return body.data as T;
  }
  return parsed as T;
}
