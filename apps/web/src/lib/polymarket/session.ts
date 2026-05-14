// Trading-session orchestration: the one-time setup a user does before
// they can trade — derive + deploy their Safe, derive L2 API creds,
// set token approvals. Each step is idempotent (skipped if already
// done), so re-running is safe.
//
// Session state is cached in sessionStorage. It only holds the Safe
// address + API creds — both deterministically re-derivable — so a
// cleared cache just means re-running setup.
import type { ApiKeyCreds } from '@polymarket/clob-client-v2';

import { ensureApiCreds } from './apiCreds';
import { checkApprovals, setApprovals } from './approvals';
import { buildClobClient } from './clob';
import { buildRelayClient } from './relayClient';
import { deploySafe, deriveSafeAddress, isSafeDeployed } from './safe';
import { getEthersSigner, getPublicClient, type PrivyWalletLike } from './wallet';

export type SessionStep =
  | 'idle'
  | 'checking'
  | 'deploying'
  | 'credentials'
  | 'approvals'
  | 'complete';

export type PolymarketSession = {
  eoaAddress: string;
  safeAddress: string;
  creds: ApiKeyCreds;
};

const storageKey = (address: string) =>
  `polymarket_session_${address.toLowerCase()}`;

export function loadStoredSession(
  eoaAddress: string,
): PolymarketSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(eoaAddress));
    if (!raw) return null;
    const session = JSON.parse(raw) as PolymarketSession;
    return session.eoaAddress?.toLowerCase() === eoaAddress.toLowerCase()
      ? session
      : null;
  } catch {
    return null;
  }
}

function storeSession(session: PolymarketSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      storageKey(session.eoaAddress),
      JSON.stringify(session),
    );
  } catch {
    // non-fatal — the session is fully re-derivable on next init.
  }
}

export function clearStoredSession(eoaAddress: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(storageKey(eoaAddress));
}

// Runs the full setup. onStep reports progress so the UI can show
// which step is running. Returns the established session.
export async function initializeSession(
  wallet: PrivyWalletLike,
  onStep: (step: SessionStep) => void,
): Promise<PolymarketSession> {
  onStep('checking');
  const eoaAddress = wallet.address;
  const signer = await getEthersSigner(wallet);
  const relayClient = buildRelayClient(signer);
  const safeAddress = deriveSafeAddress(eoaAddress);

  const deployed = await isSafeDeployed(
    relayClient,
    safeAddress,
    getPublicClient(),
  );
  if (!deployed) {
    onStep('deploying');
    await deploySafe(relayClient);
  }

  onStep('credentials');
  const creds = await ensureApiCreds(signer, eoaAddress);

  onStep('approvals');
  const approved = await checkApprovals(safeAddress);
  if (!approved) {
    await setApprovals(relayClient);
  }

  const session: PolymarketSession = { eoaAddress, safeAddress, creds };
  storeSession(session);
  onStep('complete');
  return session;
}

// Builds the authenticated CLOB client for an established session.
// Re-fetches a fresh signer each call (cheap; keeps no stale provider).
export async function getClobClientForSession(
  wallet: PrivyWalletLike,
  session: PolymarketSession,
) {
  const signer = await getEthersSigner(wallet);
  return buildClobClient({
    signer,
    creds: session.creds,
    funderAddress: session.safeAddress,
  });
}
