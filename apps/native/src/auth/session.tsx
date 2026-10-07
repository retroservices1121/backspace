import { createContext, useContext } from 'react';

export type SessionUser = { id: string; email: string | null };
export type Session = {
  ready: boolean;
  configured: boolean;
  user: SessionUser | null;
  flow: 'idle' | 'sending' | 'code' | 'verifying';
  error: string | null;
  sendEmailCode: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
};

export const emptySession: Session = {
  ready: true,
  configured: false,
  user: null,
  flow: 'idle',
  error: null,
  sendEmailCode: async () => { throw new Error('Native sign-in is not configured.'); },
  verifyEmailCode: async () => { throw new Error('Native sign-in is not configured.'); },
  getAccessToken: async () => null,
  logout: async () => undefined,
};

export const SessionContext = createContext<Session>(emptySession);
export function useSession() { return useContext(SessionContext); }
