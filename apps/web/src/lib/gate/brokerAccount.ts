// SERVER-ONLY. Import from Next.js API routes under src/pages/api only.
//
// Private Gate DexBuilder access for a signed-in Backspace user, via the
// Broker API key held in server env (GATE_BROKER_API_KEY /
// GATE_BROKER_API_SECRET). Gate is the authority for orders, positions,
// balances and fills; nothing returned here is written to Backspace's DB.
//
// Never log Broker keys, SIGN, Timestamp, Authorization headers or request
// bodies from this module.

import {
  GateBrokerClient,
  isBrokerConfigured,
  isBrokerNotConfiguredError,
  isGateBrokerError,
  type BrokerRequestOptions,
} from '@backspace/markets/server';

export type GateAccountProduct = 'prediction' | 'event_contracts';

export class GateAccountError extends Error {
  status: number;

  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'GateAccountError';
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, GateAccountError.prototype);
  }
}

const notConfigured = () => new GateAccountError(
  503,
  'gate_broker_not_configured',
  'Gate trading is not enabled on this server yet. Live public markets remain available.',
);

const registrationRequired = () => new GateAccountError(
  409,
  'gate_registration_not_enabled',
  'Gate account registration is not enabled yet. Balances and trading open once registration launches.',
);

export function parseAccountProduct(raw: unknown): GateAccountProduct {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'event_contracts' ? 'event_contracts' : 'prediction';
}

/**
 * Wallet registered under Backspace's Broker for this user, if any.
 *
 * Wallet registration (sign-message → wallet signature → register →
 * resolve) is not part of this slice, and Backspace stores no Gate wallet
 * mapping yet, so this always returns null. It must never fabricate or
 * derive an address: X-User-Wallet-Address must be a wallet Gate already
 * associates with our Broker.
 */
export async function resolveGateWallet(_authId: string): Promise<string | null> {
  return null;
}

/**
 * Signed private request on behalf of a Backspace user.
 *
 * Fails closed: 503 when Broker credentials are missing, 409 when the user
 * has no registered Gate wallet. Gate is never called unsigned or without
 * a real wallet header for private paths.
 */
export async function gateAccountRequest<T>(
  authId: string,
  product: GateAccountProduct,
  subpath: string,
  options: Omit<BrokerRequestOptions, 'walletAddress'> = {},
): Promise<T> {
  if (!isBrokerConfigured()) throw notConfigured();
  const walletAddress = await resolveGateWallet(authId);
  if (!walletAddress) throw registrationRequired();

  let client: GateBrokerClient;
  try {
    client = new GateBrokerClient({ syncClock: true });
  } catch (error) {
    if (isBrokerNotConfiguredError(error)) throw notConfigured();
    throw error;
  }

  try {
    return await client.product<T>(product, subpath, { ...options, walletAddress });
  } catch (error) {
    throw mapGateError(error);
  }
}

function mapGateError(error: unknown): GateAccountError {
  if (isBrokerNotConfiguredError(error)) return notConfigured();
  if (!isGateBrokerError(error)) {
    return new GateAccountError(502, 'gate_unavailable', 'Gate is unavailable right now. Try again shortly.');
  }
  if (error.status === 401 || error.status === 403) {
    // Our Broker key, permission, IP allowlist or clock. Not the user's fault,
    // and the details stay in Gate's response, not ours.
    return new GateAccountError(502, 'gate_broker_rejected', 'Gate did not accept Backspace\'s Broker credentials.');
  }
  if (error.status === 429) {
    return new GateAccountError(429, 'gate_rate_limited', 'Gate is rate limiting requests. Try again shortly.');
  }
  if (error.status >= 400 && error.status < 500) {
    // Order validation and similar business errors are safe to surface.
    return new GateAccountError(error.status, error.label || 'gate_rejected', error.message || 'Gate rejected the request.');
  }
  return new GateAccountError(502, 'gate_unavailable', 'Gate is unavailable right now. Try again shortly.');
}

export function sendGateAccountError(
  res: { status(code: number): { json(body: unknown): unknown } },
  error: unknown,
): boolean {
  if (!(error instanceof GateAccountError)) return false;
  res.status(error.status).json({ error: error.message, code: error.code });
  return true;
}
