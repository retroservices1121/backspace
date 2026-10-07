import { PrivyProvider, useLoginWithEmail, usePrivy } from '@privy-io/expo';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { emptySession, SessionContext, type Session, type SessionUser } from './session';

const appId = process.env.EXPO_PUBLIC_PRIVY_APP_ID;
const clientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!appId || !clientId) return <SessionContext.Provider value={emptySession}>{children}</SessionContext.Provider>;
  return <PrivyProvider appId={appId} clientId={clientId}><SessionBridge>{children}</SessionBridge></PrivyProvider>;
}

function SessionBridge({ children }: { children: ReactNode }) {
  const { user, isReady, getAccessToken, logout } = usePrivy();
  const [message, setMessage] = useState<string | null>(null);
  const emailLogin = useLoginWithEmail({ onError: (reason) => setMessage(reason.message) });
  const sessionUser = useMemo<SessionUser | null>(() => {
    if (!user) return null;
    const accounts = (user as unknown as { linked_accounts?: { type?: string; address?: string }[] }).linked_accounts ?? [];
    return { id: user.id, email: accounts.find((account) => account.type === 'email')?.address ?? null };
  }, [user]);
  const flow: Session['flow'] = emailLogin.state.status === 'sending-code' ? 'sending'
    : emailLogin.state.status === 'awaiting-code-input' ? 'code'
      : emailLogin.state.status === 'submitting-code' ? 'verifying' : 'idle';
  const state = useMemo(() => ({
    ready: isReady,
    configured: true,
    user: sessionUser,
    flow,
    error: emailLogin.state.status === 'error' ? emailLogin.state.error?.message ?? message : message,
    sendEmailCode: async (email: string) => { setMessage(null); await emailLogin.sendCode({ email }); },
    verifyEmailCode: async (email: string, code: string) => { setMessage(null); await emailLogin.loginWithCode({ email, code }); },
    getAccessToken,
    logout,
  }), [emailLogin, flow, getAccessToken, isReady, logout, message, sessionUser]);
  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}
