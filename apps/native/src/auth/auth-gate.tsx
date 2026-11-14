import { hasAvatar, isApiError } from '@backspace/api-client';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '@/auth/session';
import { useMe } from '@/hooks/use-me';

/**
 * Where the signed-in state says the person belongs. The root layout turns this into
 * `Stack.Protected` guards, and `src/app/index.tsx` turns it into a redirect or a loading/retry screen.
 *
 * - `loading`: the session is restoring, `useMe` has not answered yet, or an expired session is being cleared.
 * - `signed-out`: no session. Only /sign-in is reachable.
 * - `needs-onboarding`: signed in, and GET /user/self returned JSON `null` (no User row) or a User row with
 *   no `avatar` (onboarding stopped after POST /user). Only /onboarding is reachable.
 * - `ready`: signed in with a Backspace profile that has an avatar. The tabs and other authenticated routes are reachable.
 * - `error`: `useMe` failed with something other than 401 and there is no cached finished profile (first load,
 *   or the cached answer was `null` or had no avatar). Shows a retry state, never the onboarding form. A cached
 *   profile with an avatar stays `ready`.
 * - `expired`: `useMe` returned 401 and clearing the session failed. Shows a "sign in again" state.
 */
export type GateStatus = 'loading' | 'signed-out' | 'needs-onboarding' | 'ready' | 'error' | 'expired';

export type AuthGate = {
  status: GateStatus;
  /** Message for the `error` and `expired` states. */
  error: string | null;
  retry: () => void;
  retrying: boolean;
  /** Ends the session and clears cached API data. Callers navigate to /sign-in afterwards. */
  signOut: () => Promise<void>;
};

const AuthGateContext = createContext<AuthGate | null>(null);

export function useAuthGate(): AuthGate {
  const gate = useContext(AuthGateContext);
  if (!gate) throw new Error('useAuthGate must be used inside <AuthGateProvider>.');
  return gate;
}

/** Must sit inside both the session provider and QueryClientProvider. */
export function AuthGateProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const me = useMe();
  const queryClient = useQueryClient();
  const { logout } = session;
  const [endingSession, setEndingSession] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const autoSignOutStarted = useRef(false);

  const signOut = useCallback(async () => {
    setEndingSession(true);
    setEndError(null);
    try {
      await logout();
      queryClient.clear();
    } catch (error) {
      setEndError(error instanceof Error ? error.message : 'Could not sign out.');
      throw error;
    } finally {
      setEndingSession(false);
    }
  }, [logout, queryClient]);

  const signedIn = session.ready && Boolean(session.user);
  const unauthorized = signedIn && me.isError && isApiError(me.error) && me.error.status === 401;

  // A 401 from /user/self means the server no longer accepts this session: clear it so the person
  // lands on sign-in instead of looping on a screen that cannot load.
  useEffect(() => {
    if (!unauthorized) { autoSignOutStarted.current = false; return; }
    if (autoSignOutStarted.current) return;
    autoSignOutStarted.current = true;
    signOut().catch(() => undefined);
  }, [unauthorized, signOut]);

  let status: GateStatus;
  if (!session.ready) status = 'loading';
  else if (!session.user) status = 'signed-out';
  else if (unauthorized) status = endError && !endingSession ? 'expired' : 'loading';
  else if (me.data === undefined) status = me.isError ? 'error' : 'loading';
  // Onboarding is unfinished with no User row, or with a User row but no avatar Media row (POST /user
  // succeeded and the avatar write did not, before a restart or re-sign-in). A cached unfinished answer is
  // not trustworthy once a refetch has failed: show the retry state rather than the onboarding form. A
  // cached finished profile, by contrast, stays `ready` through background failures.
  else if (me.data === null || !hasAvatar(me.data)) status = me.isError ? 'error' : 'needs-onboarding';
  else status = 'ready';

  const { refetch, isFetching } = me;
  const error = status === 'expired' ? endError : status === 'error' ? (me.error instanceof Error ? me.error.message : 'Something went wrong.') : null;
  const retry = useCallback(() => { refetch().catch(() => undefined); }, [refetch]);
  const value = useMemo<AuthGate>(() => ({ status, error, retry, retrying: isFetching || endingSession, signOut }), [status, error, retry, isFetching, endingSession, signOut]);
  return <AuthGateContext.Provider value={value}>{children}</AuthGateContext.Provider>;
}

/** Path the gate sends a person to for a given status, or null when the entry screen should render its own state. */
export function gateHome(status: GateStatus): '/sign-in' | '/onboarding' | '/(tabs)/communities' | null {
  switch (status) {
    case 'signed-out': return '/sign-in';
    case 'needs-onboarding': return '/onboarding';
    case 'ready': return '/(tabs)/communities';
    default: return null;
  }
}
