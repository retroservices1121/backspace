type GatewayOptions = { method?: 'GET' | 'POST'; body?: unknown };

export class GateAccountGatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/**
 * Calls the private Gate account service. This service is the only component
 * allowed to hold or mint Gate account credentials. The mobile app presents a
 * verified Backspace token to this API and never receives a Gate secret.
 *
 * Market, order and position responses are returned live. Nothing is written
 * to Backspace's database by this gateway.
 */
export async function gateAccountRequest<T>(
  authId: string,
  path: string,
  options: GatewayOptions = {},
): Promise<T> {
  const base = process.env.GATE_ACCOUNT_GATEWAY_URL?.replace(/\/$/, '');
  const serviceToken = process.env.GATE_ACCOUNT_GATEWAY_TOKEN;
  if (!base || !serviceToken) {
    throw new GateAccountGatewayError(
      503,
      'Gate Builder has not enabled private account access for Backspace yet. Live public markets remain available.',
    );
  }
  const response = await fetch(`${base}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceToken}`,
      'X-Backspace-User': authId,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) {
    throw new GateAccountGatewayError(
      response.status,
      body.message || body.error || 'Gate account request failed.',
    );
  }
  return body as T;
}
